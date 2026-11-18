import { Server } from 'socket.io';
import { config } from './config.js';
import { verifyToken } from './middleware/auth.js';

let io = null;

/** WebSocket authentifié : chaque client rejoint sa salle privée `customer:<id>`. */
export function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

  io.use((socket, next) => {
    try {
      socket.data.auth = verifyToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.auth;
    socket.join(`${role}:${id}`);
  });

  return io;
}

export function emitToCustomer(userId, event, payload) {
  io?.to(`customer:${userId}`).emit(event, payload);
}
