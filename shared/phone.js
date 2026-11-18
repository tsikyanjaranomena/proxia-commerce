import { OPERATORS } from './operators.js';

/* — Téléphone Madagascar — */
export const normalizePhone = (raw) => {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('261')) d = `0${d.slice(3)}`;
  else if (d.length > 0 && !d.startsWith('0')) d = `0${d}`;
  return d.slice(0, 10);
};

export const formatPhone = (d) => {
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10)].filter(Boolean);
  return p.join(' ');
};

export const isValidPhone = (d) => /^03[23478]\d{7}$/.test(d);

export const detectOperator = (d) => Object.values(OPERATORS).find((op) => op.prefixes.includes(d.slice(0, 3))) || null;
