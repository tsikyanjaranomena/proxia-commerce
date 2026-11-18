export const formatAr = (n) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)).replace(/[\u202f\u00a0]/g, '\u00a0')}\u00a0Ar`;
