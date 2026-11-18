import { io } from 'socket.io-client';
import { API_URL } from './api.js';

/** Connexion temps réel authentifiée (suivi des commandes). */
export function connectSocket(token) {
  return io(API_URL || undefined, { auth: { token } });
}
