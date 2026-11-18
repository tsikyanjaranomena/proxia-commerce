const bool = (value, fallback) =>
  value === undefined || value === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  // Mode démo : code SMS renvoyé au client, remise validable par le client, livreurs simulés.
  demoMode: bool(process.env.DEMO_MODE, !isProd),
  paymentProvider: process.env.PAYMENT_PROVIDER || 'simulator',
  osrmUrl: process.env.OSRM_URL || 'https://router.project-osrm.org/route/v1/driving',
  otpTtlMs: 5 * 60_000,
  pendingPaymentTtlMs: 15 * 60_000,
  maxPinAttempts: 5,
};

if (!config.jwtSecret || config.jwtSecret === 'changez-moi') {
  if (isProd) throw new Error('JWT_SECRET doit être défini en production.');
  console.warn('[config] JWT_SECRET absent ou par défaut : secret de développement utilisé.');
  config.jwtSecret = config.jwtSecret || 'dev-secret-non-securise';
}
