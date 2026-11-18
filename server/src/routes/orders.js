import { Router } from 'express';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ORDER_INCLUDE, cancelPendingOrder, confirmOrder, createOrder, deliverWithPin, findOrderForUser, serializeOrder, serializePayment,
} from '../services/orders.js';
import { initiatePayment } from '../services/payments/index.js';
import { HttpError, parse } from '../utils/http.js';
import { mobilePaymentSchema, orderSchema, pinSchema } from '../utils/schemas.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth('customer'));

ordersRouter.get('/', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.auth.id },
    include: ORDER_INCLUDE,
    orderBy: { id: 'desc' },
    take: 50,
  });
  res.json({ orders: orders.map((o) => serializeOrder(o)) });
});

ordersRouter.post('/', async (req, res) => {
  const input = parse(orderSchema, req.body);
  if (input.payment.method === 'mobile') {
    input.payment = { method: 'mobile', ...parse(mobilePaymentSchema, input.payment) };
  }

  const created = await createOrder(req.auth.id, input);

  if (input.payment.method === 'mobile') {
    // La commande reste « en attente de paiement » jusqu'à la confirmation de l'opérateur.
    const payment = await initiatePayment(created.payments[0], created);
    return res.status(201).json({ order: serializeOrder(created), payment: serializePayment(payment) });
  }

  const order = (await confirmOrder(created.id)) || created;
  return res.status(201).json({ order: serializeOrder(order, { withRoute: true }), payment: null });
});

ordersRouter.get('/:code', async (req, res) => {
  const order = await findOrderForUser(req.params.code, req.auth.id);
  res.json({ order: serializeOrder(order, { withRoute: true }) });
});

/** Nouvelle tentative de paiement Mobile Money sur une commande en attente. */
ordersRouter.post('/:code/pay', async (req, res) => {
  const order = await findOrderForUser(req.params.code, req.auth.id);
  if (order.status !== 'pending_payment') throw new HttpError(409, 'Cette commande n’attend plus de paiement.', 'bad_status');
  const { operator, phone } = parse(mobilePaymentSchema, req.body);

  await prisma.payment.updateMany({ where: { orderId: order.id, status: 'pending' }, data: { status: 'cancelled' } });
  const created = await prisma.payment.create({
    data: { orderId: order.id, method: 'mobile', operator, phone, amount: order.total, status: 'pending', provider: config.paymentProvider },
  });
  const payment = await initiatePayment(created, order);
  res.status(201).json({ payment: serializePayment(payment) });
});

ordersRouter.post('/:code/cancel', async (req, res) => {
  const order = await findOrderForUser(req.params.code, req.auth.id);
  const updated = await cancelPendingOrder(order.id);
  res.json({ order: serializeOrder(updated) });
});

/**
 * Mode démo uniquement : le client valide lui-même la remise avec son PIN.
 * En production, c'est le livreur qui saisit le code (voir routes/rider.js).
 */
ordersRouter.post('/:code/confirm-delivery', async (req, res) => {
  if (!config.demoMode) throw new HttpError(403, 'La remise est validée par le livreur.', 'forbidden');
  const { pin } = parse(pinSchema, req.body);
  const order = await findOrderForUser(req.params.code, req.auth.id);
  const updated = await deliverWithPin(order, pin, ['arrived', 'ready']);
  res.json({ order: serializeOrder(updated) });
});
