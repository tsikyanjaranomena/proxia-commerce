import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { claimsRouter } from './routes/claims.js';
import { ordersRouter } from './routes/orders.js';
import { paymentsRouter } from './routes/payments.js';
import { productsRouter } from './routes/products.js';
import { riderRouter } from './routes/rider.js';

const DIST_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../dist');

export function createApp() {
  const app = express();
  if (config.isProd) app.set('trust proxy', 1); // derrière le proxy de l'hébergeur (limitation de débit par IP réelle)

  // CSP désactivée : l'interface charge des tuiles de carte et des polices depuis des domaines tiers.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true, demoMode: config.demoMode, paymentProvider: config.paymentProvider }));
  api.use('/auth', authRouter);
  api.use('/products', productsRouter);
  api.use('/orders', ordersRouter);
  api.use('/payments', paymentsRouter);
  api.use('/claims', claimsRouter);
  api.use('/rider', riderRouter);
  api.use(notFound);
  app.use('/api', api);

  // En production, le même serveur distribue l'interface construite (npm run build).
  if (existsSync(path.join(DIST_DIR, 'index.html'))) {
    app.use(express.static(DIST_DIR));
    app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(DIST_DIR, 'index.html')) : next()));
  }

  app.use(errorHandler);
  return app;
}
