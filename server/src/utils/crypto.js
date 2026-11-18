import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans 0/O ni 1/I, lisible au téléphone

export const randomDigits = (n) => Array.from({ length: n }, () => randomInt(10)).join('');

export const randomCode = (prefix, n = 6) =>
  `${prefix}-${Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;

/** Empreinte d'un code à usage unique (OTP). */
export const hmac = (value) => createHmac('sha256', config.jwtSecret).update(String(value)).digest('hex');

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Hachage d'un secret durable (code d'accès livreur). */
export function hashSecret(secret) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(String(secret), salt, 32).toString('hex')}`;
}

export function verifySecret(secret, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  return safeEqual(scryptSync(String(secret), salt, 32).toString('hex'), hash);
}
