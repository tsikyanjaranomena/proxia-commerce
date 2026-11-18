import { Router } from 'express';
import { z } from 'zod';
import { haversine } from '../../../shared/geo.js';
import { prisma } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { emitToCustomer } from '../realtime.js';
import { deliverWithPin, emitOrderUpdate } from '../services/orders.js';
import { snapProgress } from '../services/tracker.js';
import { verifySecret } from '../utils/crypto.js';
import { HttpError, parse } from '../utils/http.js';
import { phoneSchema, pinSchema } from '../utils/schemas.js';
import { authLimiter } from './auth.js';

const ARRIVAL_RADIUS_M = 60;
const RIDER_STATUSES = ['preparing', 'enroute', 'arrived'];

/** Vue livreur d'une commande : ni PIN ni itinéraire complet. */
const serializeForRider = (o) => ({
  id: o.code,
  status: o.status,
  quartier: o.quartier,
  address: o.address,
  destination: { lat: o.destLat, lng: o.destLng },
  customer: { name: o.customerName, phone: o.customerPhone },
  itemCount: o.items.reduce((n, i) => n + i.qty, 0),
  total: o.total,
  // Montant à encaisser en espèces (0 si déjà payé par Mobile Money).
  cashToCollect: o.payments.some((p) => p.method === 'cod' && p.status === 'pending') ? o.total : 0,
  trackingMode: o.trackingMode,
  createdAt: o.createdAt.getTime(),
});

async function findRiderOrder(code, riderId) {
  const order = await prisma.order.findUnique({ where: { code: String(code).toUpperCase() } });
  if (!order || order.riderId !== riderId) throw new HttpError(404, 'Commande introuvable.', 'not_found');
  return order;
}

export const riderRouter = Router();

riderRouter.post('/login', authLimiter, async (req, res) => {
  const { phone, code } = parse(z.object({ phone: phoneSchema, code: z.string({ required_error: 'Code d’accès requis.' }).min(1).max(64) }), req.body);
  const rider = await prisma.rider.findUnique({ where: { phone } });
  if (!rider || !rider.active || !verifySecret(code, rider.codeHash)) {
    throw new HttpError(401, 'Numéro ou code d’accès incorrect.', 'bad_credentials');
  }
  res.json({ token: signToken(rider.id, 'rider'), rider: { name: rider.name, phone: rider.phone, plate: rider.plate } });
});

riderRouter.use(requireAuth('rider'));

riderRouter.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { riderId: req.auth.id, status: { in: RIDER_STATUSES } },
    include: { items: true, payments: true },
    orderBy: { id: 'asc' },
  });
  res.json({ orders: orders.map(serializeForRider) });
});

/** Position GPS réelle du livreur : remplace la simulation pour cette commande. */
riderRouter.post('/orders/:code/position', async (req, res) => {
  const { lat, lng } = parse(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }), req.body);
  const order = await findRiderOrder(req.params.code, req.auth.id);
  if (!RIDER_STATUSES.includes(order.status)) throw new HttpError(409, 'Cette commande n’est plus en cours.', 'bad_status');
  if (order.status === 'arrived') return res.json({ status: 'arrived', progress: 1 });

  const arrived = haversine([lat, lng], [order.destLat, order.destLng]) <= ARRIVAL_RADIUS_M;
  const progress = arrived ? 1 : order.routeJson ? snapProgress(JSON.parse(order.routeJson).coords, [lat, lng]) : order.progress;
  const status = arrived ? 'arrived' : 'enroute';

  await prisma.order.update({ where: { id: order.id }, data: { trackingMode: 'live', status, progress } });
  if (status !== order.status || order.trackingMode !== 'live') await emitOrderUpdate(order.id);
  else emitToCustomer(order.userId, 'order:progress', { id: order.code, progress });
  return res.json({ status, progress });
});

riderRouter.post('/orders/:code/arrived', async (req, res) => {
  const order = await findRiderOrder(req.params.code, req.auth.id);
  if (!['preparing', 'enroute'].includes(order.status)) throw new HttpError(409, 'Cette commande n’est plus en route.', 'bad_status');
  await prisma.order.update({ where: { id: order.id }, data: { status: 'arrived', progress: 1 } });
  await emitOrderUpdate(order.id);
  res.json({ status: 'arrived' });
});

/** Remise du colis : le livreur saisit le PIN que lui donne le client. */
riderRouter.post('/orders/:code/deliver', async (req, res) => {
  const { pin } = parse(pinSchema, req.body);
  const order = await findRiderOrder(req.params.code, req.auth.id);
  await deliverWithPin(order, pin, ['enroute', 'arrived']);
  res.json({ status: 'delivered' });
});
