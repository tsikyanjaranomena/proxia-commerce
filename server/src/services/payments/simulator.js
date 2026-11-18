import { OPERATORS } from '../../../../shared/operators.js';
import { randomDigits } from '../../utils/crypto.js';

/**
 * Fournisseur de paiement simulé : aucun argent ne circule.
 * Le client « valide » depuis l'écran USSD simulé, qui appelle POST /api/payments/:id/simulate.
 */
export const simulator = {
  name: 'simulator',

  async initiate({ payment }) {
    return { providerRef: `SIM-${payment.id}` };
  },

  /** Issue d'un scénario de test. */
  resolve({ payment, scenario }) {
    if (scenario === 'insufficient_funds') {
      return { status: 'failed', reason: 'Solde insuffisant. Rechargez votre compte ou choisissez un autre mode de paiement.' };
    }
    const day = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const logo = OPERATORS[payment.operator]?.logo || 'MM';
    return { status: 'paid', txRef: `${logo}${day}.${randomDigits(4)}.${randomDigits(4)}` };
  },
};
