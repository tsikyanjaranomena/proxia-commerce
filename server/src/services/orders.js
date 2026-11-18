import {
  FREE_DELIVERY_THRESHOLD, HQ, MAX_DELIVERY_KM, MAX_RIDE_MS, MIN_RIDE_MS, OUT_OF_ZONE_MESSAGE, PICKUP_PREP_MS, PREP_MS, SIM_SPEEDUP,
} from '../../../shared/config.js';
import { deliveryFeeFor, distanceFromHQ, nearestQuartier } from '../../../shared/geo.js';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { emitToCustomer } from '../realtime.js';
import { randomCode, randomDigits, safeEqual } from '../utils/crypto.js';
import { HttpError } from '../utils/http.js';
import { getRoute } from './routing.js';

export const ACTIVE_STATUSES = ['pending_payment', 'preparing', 'enroute', 'arrived', 'ready'];

export const ORDER_INCLUDE = { items: true, rider: true, payments: { orderBy: { id: 'desc' }, take: 1 } };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Avancement du livreur (0 → 1). En mode simulé il se déduit de l'horloge, sans écriture en base. */
export function currentProgress(order, now = Date.now()) {
  if (order.status === 'arrived' || order.status === 'delivered') return 1;
  if (order.status === 'enroute' && order.trackingMode === 'sim' && order.rideStartAt && order.rideDurationMs) {
    return clamp((now - order.rideStartAt.getTime()) / order.rideDurationMs, 0, 1);
  }
  return order.progress;
}

export const serializePayment = (p) => ({
  id: p.id,
  method: p.method,
  operator: p.operator,
  phone: p.phone,
  amount: p.amount,
  status: p.status,
  txRef: p.txRef,
  failureReason: p.failureReason,
  mode: p.provider === 'simulator' ? 'simulator' : 'live',
});

/** Vue client d'une commande. L'itinéraire (volumineux) n'est joint que sur demande. */
export function serializeOrder(order, { withRoute = false } = {}) {
  const payment = order.payments?.[0];
  const out = {
    id: order.code,
    status: order.status,
    reception: order.reception,
    quartier: order.quartier,
    address: order.address,
    destination: { lat: order.destLat, lng: order.destLng },
    customer: { name: order.customerName, phone: order.customerPhone },
    items: order.items.map((i) => ({ id: i.productId, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
    subtotal: order.subtotal,
    fee: order.fee,
    total: order.total,
    pin: order.pin,
    payment: payment ? serializePayment(payment) : null,
    rider: order.rider
      ? {
          name: order.rider.name,
          phone: order.rider.phone,
          plate: order.rider.plate,
          moto: order.rider.moto,
          rating: order.rider.rating,
          trips: order.rider.trips,
          battery: order.riderBattery,
        }
      : null,
    trackingMode: order.trackingMode,
    progress: currentProgress(order),
    hasRoute: Boolean(order.routeJson),
    demo: config.demoMode,
    createdAt: order.createdAt.getTime(),
    deliveredAt: order.deliveredAt?.getTime() ?? null,
  };
  if (withRoute && order.routeJson) out.route = JSON.parse(order.routeJson);
  return out;
}

export async function findOrderForUser(code, userId) {
  const order = await prisma.order.findUnique({ where: { code: String(code).toUpperCase() }, include: ORDER_INCLUDE });
  if (!order || order.userId !== userId) throw new HttpError(404, 'Commande introuvable.', 'not_found');
  return order;
}

/** Recharge la commande et pousse son nouvel état au client connecté. */
export async function emitOrderUpdate(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (order) emitToCustomer(order.userId, 'order:update', serializeOrder(order));
  return order;
}

/** Livreur actif le moins chargé (au hasard en cas d'égalité). */
async function pickRider(tx) {
  const riders = await tx.rider.findMany({
    where: { active: true },
    select: { id: true, _count: { select: { orders: { where: { status: { in: ACTIVE_STATUSES } } } } } },
  });
  if (riders.length === 0) throw new HttpError(503, 'Aucun livreur disponible pour le moment. Réessayez dans quelques minutes.', 'no_rider');
  const min = Math.min(...riders.map((r) => r._count.orders));
  const pool = riders.filter((r) => r._count.orders === min);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

/**
 * Crée la commande dans une transaction : prix et frais recalculés côté serveur,
 * stock décrémenté de façon atomique. Le total envoyé par le navigateur n'est jamais utilisé.
 */
export async function createOrder(userId, input) {
  const isDelivery = input.reception === 'delivery';
  const dest = isDelivery ? input.destination : { lat: HQ.lat, lng: HQ.lng };
  if (isDelivery && distanceFromHQ(dest) / 1000 > MAX_DELIVERY_KM) {
    throw new HttpError(400, OUT_OF_ZONE_MESSAGE, 'out_of_zone');
  }

  const wanted = new Map();
  for (const { id, qty } of input.items) wanted.set(id, (wanted.get(id) || 0) + qty);

  const isMobile = input.payment.method === 'mobile';

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...wanted.keys()] }, active: true } });
    if (products.length !== wanted.size) {
      throw new HttpError(400, 'Un produit de votre panier n’est plus disponible.', 'unavailable');
    }

    let subtotal = 0;
    const lines = [];
    for (const p of products) {
      const qty = wanted.get(p.id);
      const updated = await tx.product.updateMany({ where: { id: p.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (updated.count === 0) {
        throw new HttpError(409, `Stock insuffisant pour « ${p.name} » (${p.stock} en stock).`, 'stock');
      }
      subtotal += p.price * qty;
      lines.push({ productId: p.id, name: p.name, emoji: p.emoji, price: p.price, qty });
    }

    const fee = !isDelivery || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryFeeFor(dest);
    const total = subtotal + fee;

    return tx.order.create({
      data: {
        code: randomCode('MX'),
        userId,
        status: isMobile ? 'pending_payment' : 'preparing',
        reception: input.reception,
        quartier: isDelivery ? nearestQuartier(dest).name : 'Ankorondrano (siège)',
        address: isDelivery ? input.address : HQ.address,
        destLat: dest.lat,
        destLng: dest.lng,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        subtotal,
        fee,
        total,
        pin: randomDigits(4),
        riderId: isDelivery ? await pickRider(tx) : null,
        riderBattery: 72 + Math.floor(Math.random() * 25),
        trackingMode: config.demoMode ? 'sim' : 'live',
        items: { create: lines },
        payments: {
          create: {
            method: input.payment.method,
            operator: isMobile ? input.payment.operator : null,
            phone: isMobile ? input.payment.phone : null,
            amount: total,
            status: 'pending',
            provider: isMobile ? config.paymentProvider : null,
          },
        },
      },
      include: ORDER_INCLUDE,
    });
  });
}

/**
 * Lance la préparation d'une commande validée (paiement reçu ou paiement à la livraison) :
 * calcule l'itinéraire routier réel et planifie le départ du livreur.
 */
export async function confirmOrder(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !['pending_payment', 'preparing'].includes(order.status)) return null;

  const data = { status: 'preparing' };
  if (order.reception === 'delivery') {
    if (!order.routeJson) {
      const route = await getRoute(HQ, { lat: order.destLat, lng: order.destLng });
      data.routeJson = JSON.stringify(route);
      data.rideDurationMs = Math.round(clamp((route.duration * 1000) / SIM_SPEEDUP, MIN_RIDE_MS, MAX_RIDE_MS));
      data.rideStartAt = new Date(Date.now() + PREP_MS);
    }
  } else if (!order.readyAt) {
    data.readyAt = new Date(Date.now() + PICKUP_PREP_MS);
  }
  await prisma.order.update({ where: { id: orderId }, data });
  return emitOrderUpdate(orderId);
}

/** Annule une commande non payée et remet les articles en stock. */
export async function cancelPendingOrder(orderId) {
  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: orderId, status: 'pending_payment' }, data: { status: 'cancelled' } });
    if (updated.count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
    }
    await tx.payment.updateMany({ where: { orderId, status: 'pending' }, data: { status: 'cancelled' } });
    return true;
  });
  if (!cancelled) throw new HttpError(409, 'Cette commande ne peut plus être annulée.', 'not_cancellable');
  return emitOrderUpdate(orderId);
}

/** Clôture la commande si le code PIN est bon. Le nombre d'essais est limité. */
export async function deliverWithPin(order, pin, allowedStatuses) {
  if (!allowedStatuses.includes(order.status)) {
    throw new HttpError(409, 'Cette commande ne peut pas être clôturée pour le moment.', 'bad_status');
  }
  if (order.pinAttempts >= config.maxPinAttempts) {
    throw new HttpError(423, 'Trop de codes erronés : commande verrouillée. Contactez le support.', 'pin_locked');
  }
  if (!safeEqual(pin, order.pin)) {
    await prisma.order.update({ where: { id: order.id }, data: { pinAttempts: { increment: 1 } } });
    const left = config.maxPinAttempts - order.pinAttempts - 1;
    throw new HttpError(
      400,
      left > 0 ? `Code incorrect. ${left} essai${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}.` : 'Code incorrect : commande verrouillée. Contactez le support.',
      'pin_invalid'
    );
  }
  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: 'delivered', deliveredAt: new Date(), progress: 1 } }),
    // Paiement à la livraison : les espèces sont encaissées à la remise.
    prisma.payment.updateMany({ where: { orderId: order.id, method: 'cod', status: 'pending' }, data: { status: 'paid' } }),
  ]);
  return emitOrderUpdate(order.id);
}
