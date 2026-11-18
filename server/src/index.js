import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { initRealtime } from './realtime.js';
import { startTracker } from './services/tracker.js';

const server = createServer(createApp());
initRealtime(server);
const stopTracker = startTracker();

server.listen(config.port, () => {
  console.log(`API MadaExpress sur http://localhost:${config.port} (démo : ${config.demoMode ? 'oui' : 'non'}, paiement : ${config.paymentProvider})`);
});

async function shutdown() {
  stopTracker();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
