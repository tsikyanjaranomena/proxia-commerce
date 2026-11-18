import { haversine } from '../../../shared/geo.js';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { emitToCustomer } from '../realtime.js';
import { cancelPendingOrder, confirmOrder, currentProgress, emitOrderUpdate } from './orders.js';

const TICK_MS = 1000;

/** Avancement (0 → 1) du point GPS le plus proche sur le tracé de l'itinéraire. */
export function snapProgress(coords, point) {
  if (!coords?.length) return 0;
  let total = 0;
  let best = { d: Infinity, at: 0 };
  for (let i = 0; i < coords.length; i++) {
    if (i > 0) total += haversine(coords[i - 1], coords[i]);
    const d = haversine(coords[i], point);
    if (d < best.d) best = { d, at: total };
  }
  return total > 0 ? best.at / total : 0;
}

async function tick(count) {
  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: { status: { in: ['preparing', 'enroute'] } },
    select: {
      id: true, code: true, userId: true, status: true, reception: true, trackingMode: true,
      rideStartAt: true, rideDurationMs: true, readyAt: true, progress: true, createdAt: true,
    },
  });

  for (const o of orders) {
    if (o.reception === 'pickup') {
      if (o.readyAt && o.readyAt.getTime() <= now) {
        await prisma.order.update({ where: { id: o.id }, data: { status: 'ready' } });
        await emitOrderUpdate(o.id);
      } else if (!o.readyAt && now - o.createdAt.getTime() > 20_000) {
        await confirmOrder(o.id); // reprise d'une confirmation interrompue
      }
      continue;
    }

    if (!o.rideStartAt) {
      if (now - o.createdAt.getTime() > 20_000) await confirmOrder(o.id); // idem : itinéraire jamais calculé
      continue;
    }
    if (o.trackingMode !== 'sim' || o.rideStartAt.getTime() > now) continue;

    // Livreur simulé : il avance le long de l'itinéraire selon l'horloge.
    const progress = currentProgress({ ...o, status: 'enroute' }, now);
    if (progress >= 1) {
      await prisma.order.update({ where: { id: o.id }, data: { status: 'arrived', progress: 1 } });
      await emitOrderUpdate(o.id);
    } else if (o.status === 'preparing') {
      await prisma.order.update({ where: { id: o.id }, data: { status: 'enroute' } });
      await emitOrderUpdate(o.id);
    } else {
      emitToCustomer(o.userId, 'order:progress', { id: o.code, progress });
    }
  }

  // Toutes les 30 s : libère le stock des commandes dont le paiement n'a jamais abouti.
  if (count % 30 === 0) {
    const stale = await prisma.order.findMany({
      where: { status: 'pending_payment', createdAt: { lt: new Date(now - config.pendingPaymentTtlMs) } },
      select: { id: true },
    });
    for (const { id } of stale) await cancelPendingOrder(id).catch(() => {});
  }
}

/** Boucle de suivi : fait progresser les commandes en cours et notifie les clients. */
export function startTracker() {
  let busy = false;
  let count = 0;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await tick(count++);
    } catch (err) {
      console.error('[suivi]', err);
    } finally {
      busy = false;
    }
  }, TICK_MS);
  return () => clearInterval(timer);
}
