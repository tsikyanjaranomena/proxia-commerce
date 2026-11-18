import multer from 'multer';
import { HttpError } from '../utils/http.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Ressource introuvable.', 'not_found'));
}

// eslint-disable-next-line no-unused-vars -- Express reconnaît un gestionnaire d'erreurs à ses 4 arguments
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image trop lourde (8 Mo max).' : 'Fichier refusé.';
    return res.status(400).json({ error: message, code: 'upload' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide.', code: 'validation' });
  }
  console.error('[erreur]', err);
  return res.status(500).json({ error: 'Erreur interne du serveur.', code: 'internal' });
}
