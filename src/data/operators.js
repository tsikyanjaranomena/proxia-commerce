import { OPERATORS as BASE } from '../../shared/operators.js';

/** Habillage visuel des opérateurs (les données métier vivent dans shared/). */
const STYLES = {
  mvola: { badge: 'bg-yellow-400 text-yellow-950', ring: 'ring-yellow-400', soft: 'bg-yellow-50' },
  orange: { badge: 'bg-orange-500 text-white', ring: 'ring-orange-500', soft: 'bg-orange-50' },
  airtel: { badge: 'bg-red-600 text-white', ring: 'ring-red-600', soft: 'bg-red-50' },
};

export const OPERATORS = Object.fromEntries(Object.values(BASE).map((op) => [op.id, { ...op, ...STYLES[op.id] }]));
