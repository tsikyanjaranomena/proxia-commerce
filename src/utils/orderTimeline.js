/** Libellés des statuts de commande renvoyés par le serveur. */
export const PHASE_META = {
  pending_payment: { label: 'Paiement en attente', chip: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmée', chip: 'bg-sky-100 text-sky-800' },
  preparing: { label: 'En préparation', chip: 'bg-amber-100 text-amber-800' },
  enroute: { label: 'En route', chip: 'bg-blue-100 text-blue-800' },
  arrived: { label: 'Livreur arrivé', chip: 'bg-violet-100 text-violet-800' },
  ready: { label: 'Prête au retrait', chip: 'bg-violet-100 text-violet-800' },
  delivered: { label: 'Livrée', chip: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Annulée', chip: 'bg-slate-200 text-slate-600' },
};

export const phaseMeta = (order) => {
  if (order.status === 'delivered' && order.reception === 'pickup') return { ...PHASE_META.delivered, label: 'Retirée' };
  return PHASE_META[order.status] || { label: order.status, chip: 'bg-slate-200 text-slate-600' };
};

export const isActiveOrder = (order) => order.status !== 'delivered' && order.status !== 'cancelled';

/** Commande confirmée et pas encore remise : préparation, trajet, arrivée ou prête au retrait. */
export const isInProgress = (order) => ['preparing', 'enroute', 'arrived', 'ready'].includes(order.status);

/** Avancement du livreur sur l'itinéraire, de 0 à 1. */
export const orderProgress = (order) =>
  order.status === 'arrived' || order.status === 'delivered' ? 1 : Math.min(1, Math.max(0, order.progress || 0));
