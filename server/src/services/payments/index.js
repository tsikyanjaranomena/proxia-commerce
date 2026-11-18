import { config } from '../../config.js';
import { prisma } from '../../db.js';
import { HttpError } from '../../utils/http.js';
import { confirmOrder, emitOrderUpdate } from '../orders.js';
import { simulator } from './simulator.js';

/**
 * Fournisseurs de paiement Mobile Money.
 *
 * Pour brancher un opérateur réel (MVola, Orange Money, Airtel Money), ajoutez un
 * module exposant cette interface, enregistrez-le ci-dessous, puis définissez
 * PAYMENT_PROVIDER dans .env :
 *
 *   initiate({ payment, order }) → { providerRef }
 *       Envoie la demande de paiement au téléphone du client et retourne la
 *       référence de transaction attribuée par l'opérateur.
 *
 *   parseWebhook(req) → { providerRef, status: 'paid' | 'failed', txRef?, reason? }
 *       Vérifie l'authenticité du rappel de l'opérateur (signature, jeton) et en
 *       extrait le résultat. Reçu sur POST /api/payments/webhook/<nom>.
 */
const PROVIDERS = { simulator };

export function getProvider(name = config.paymentProvider) {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Fournisseur de paiement inconnu : « ${name} ».`);
  return provider;
}

/** Envoie la demande de paiement à l'opérateur. */
export async function initiatePayment(payment, order) {
  try {
    const { providerRef } = await getProvider(payment.provider).initiate({ payment, order });
    return await prisma.payment.update({ where: { id: payment.id }, data: { providerRef } });
  } catch (err) {
    console.error('[paiement] échec de l’initialisation :', err);
    await settlePayment(payment.id, { status: 'failed', reason: 'Service de paiement indisponible.' });
    throw new HttpError(502, 'Le service de paiement est indisponible. Réessayez dans un instant.', 'payment_unavailable');
  }
}

/**
 * Enregistre l'issue d'un paiement. Idempotent : un paiement déjà réglé ou échoué
 * n'est pas modifié (les opérateurs peuvent rappeler plusieurs fois).
 */
export async function settlePayment(paymentId, { status, txRef, reason }) {
  const updated = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'pending' },
    data: { status, txRef: txRef ?? null, failureReason: reason ?? null },
  });
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (updated.count === 0) return payment;

  if (status === 'paid') {
    const order = await confirmOrder(payment.orderId);
    if (!order) {
      // Paiement arrivé après annulation/expiration de la commande : un remboursement manuel est nécessaire.
      console.error(`[paiement] ${payment.id} encaissé pour une commande non confirmable (${payment.orderId}) : à rembourser.`);
    }
  } else {
    await emitOrderUpdate(payment.orderId);
  }
  return payment;
}
