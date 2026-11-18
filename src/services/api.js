import { storage } from '../utils/storage.js';

// En développement, Vite relaie /api vers le serveur (voir vite.config.js).
// En production sur un autre domaine, définissez VITE_API_URL.
export const API_URL = import.meta.env.VITE_API_URL || '';

let token = storage.get('token', null);
let onUnauthorized = null;

export const getToken = () => token;

export function setToken(value) {
  token = value;
  storage.set('token', value);
}

/** Appelé quand le serveur refuse la session du client (jeton expiré ou révoqué). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Appel JSON à l'API. `body` peut être un objet (JSON) ou un FormData (envoi de fichier).
 * `token` permet d'utiliser une autre session que celle du client (espace livreur).
 */
export async function api(path, { method = 'GET', body, token: override } = {}) {
  const headers = {};
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const bearer = override ?? token;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: isForm ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Serveur injoignable. Vérifiez votre connexion.', 0, 'network');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !override) onUnauthorized?.();
    throw new ApiError(data?.error || `Erreur ${res.status}. Réessayez.`, res.status, data?.code);
  }
  return data;
}
