import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { serializePayment } from '../services/orders.js';
import { getProvider, settlePayment } from '../services/payments/index.js';
import { HttpError, parse } from '../utils/http.js';

export const paymentsRouter = Router();

/** Rappel serveur-à-serveur d'un opérateur (pas d'authentification client : le fournisseur vérifie la signature). */
paymentsRouter.post('/webhook/:provider', async (req, res) => {
  let provider;
  try {
    provider = getProvider(req.params.provider);
  } catch {
    provider = null;
  }
  if (!provider?.parseWebhook) throw new HttpError(404, 'Fournisseur inconnu.', 'not_found');

  const result = await provider.parseWebhook(req);
  const payment = await prisma.payment.findFirst({ where: { provider: provider.name, providerRef: result.providerRef } });
  if (!payment) throw new HttpError(404, 'Paiement inconnu.', 'not_found');
  await settlePayment(payment.id, result);
  res.json({ ok: true });
});

async function findOwnPayment(id, userId) {
  const paymentId = Number(id);
  const payment = Number.isInteger(paymentId)
    ? await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: { select: { userId: true } } } })
    : null;
  if (!payment || payment.order.userId !== userId) throw new HttpError(404, 'Paiement introuvable.', 'not_found');
  return payment;
}

/** État d'un paiement (interrogé par le client en attendant la validation sur le téléphone). */
paymentsRouter.get('/:id', requireAuth('customer'), async (req, res) => {
  const payment = await findOwnPayment(req.params.id, req.auth.id);
  res.json({ payment: serializePayment(payment) });
});

/** Simulateur uniquement : joue l'issue du paiement depuis l'écran USSD simulé. */
paymentsRouter.post('/:id/simulate', requireAuth('customer'), async (req, res) => {
  const { scenario } = parse(z.object({ scenario: z.enum(['success', 'insufficient_funds']) }), req.body);
  const payment = await findOwnPayment(req.params.id, req.auth.id);
  if (payment.provider !== 'simulator') throw new HttpError(403, 'Simulation indisponible pour ce paiement.', 'forbidden');
  if (payment.status !== 'pending') throw new HttpError(409, 'Ce paiement est déjà traité.', 'bad_status');

  const settled = await settlePayment(payment.id, getProvider('simulator').resolve({ payment, scenario }));
  res.json({ payment: serializePayment(settled) });
});
