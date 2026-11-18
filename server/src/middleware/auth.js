import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/http.js';

export const signToken = (id, role) => jwt.sign({ sub: String(id), role }, config.jwtSecret, { expiresIn: '30d' });

export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  return { id: Number(payload.sub), role: payload.role };
}

/** Exige un jeton valide du rôle donné ('customer' ou 'rider') ; renseigne req.auth. */
export const requireAuth = (role) => (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Connexion requise.', 'unauthenticated');
  let auth;
  try {
    auth = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Session expirée, reconnectez-vous.', 'unauthenticated');
  }
  if (auth.role !== role) throw new HttpError(403, 'Accès refusé.', 'forbidden');
  req.auth = auth;
  next();
};
