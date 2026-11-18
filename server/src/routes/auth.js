import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { sendSms } from '../services/sms.js';
import { hmac, randomDigits, safeEqual } from '../utils/crypto.js';
import { HttpError, parse } from '../utils/http.js';
import { phoneSchema } from '../utils/schemas.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.', code: 'rate_limited' },
});

const MAX_OTP_ATTEMPTS = 5;
const otpHash = (phone, code) => hmac(`${phone}:${code}`);
const publicUser = (u) => ({ phone: u.phone, name: u.name });

export const authRouter = Router();

/** Étape 1 : envoie un code à 6 chiffres par SMS. */
authRouter.post('/request-otp', authLimiter, async (req, res) => {
  const { phone } = parse(z.object({ phone: phoneSchema }), req.body);
  const code = randomDigits(6);
  await prisma.otpCode.deleteMany({ where: { phone } });
  await prisma.otpCode.create({
    data: { phone, codeHash: otpHash(phone, code), expiresAt: new Date(Date.now() + config.otpTtlMs) },
  });
  await sendSms(phone, `MadaExpress : votre code de connexion est ${code}. Valable 5 minutes.`);
  // En mode démo (pas de passerelle SMS), le code est renvoyé pour être affiché à l'écran.
  res.json({ ok: true, ...(config.demoMode && { devCode: code }) });
});

/** Étape 2 : vérifie le code et ouvre la session. */
authRouter.post('/verify-otp', authLimiter, async (req, res) => {
  const { phone, code, name } = parse(
    z.object({
      phone: phoneSchema,
      code: z.string({ required_error: 'Code requis.' }).regex(/^\d{6}$/, 'Le code comporte 6 chiffres.'),
      name: z.string().trim().max(80).optional(),
    }),
    req.body
  );

  const otp = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { id: 'desc' } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) throw new HttpError(400, 'Code expiré. Demandez-en un nouveau.', 'otp_expired');
  if (otp.attempts >= MAX_OTP_ATTEMPTS) throw new HttpError(429, 'Trop d’essais. Demandez un nouveau code.', 'otp_locked');
  if (!safeEqual(otpHash(phone, code), otp.codeHash)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, 'Code incorrect.', 'otp_invalid');
  }
  await prisma.otpCode.deleteMany({ where: { phone } });

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, name: name || '' },
    update: name ? { name } : {},
  });
  res.json({ token: signToken(user.id, 'customer'), user: publicUser(user) });
});

authRouter.get('/me', requireAuth('customer'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth.id } });
  if (!user) throw new HttpError(401, 'Compte introuvable.', 'unauthenticated');
  res.json({ user: publicUser(user) });
});
