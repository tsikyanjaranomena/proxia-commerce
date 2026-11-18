import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { randomCode } from '../utils/crypto.js';
import { HttpError, parse } from '../utils/http.js';
import { phoneSchema } from '../utils/schemas.js';

const CLAIM_TYPES = ['retard', 'abime', 'livreur', 'erreur', 'paiement', 'autre'];
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif' };

// Les photos sont stockées hors du dossier public : elles ne sont pas servies par l'API.
const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    EXTENSIONS[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Photo refusée : formats acceptés JPG, PNG, WebP ou HEIC.', 'upload')),
});

const claimSchema = z.object({
  orderCode: z.string({ required_error: 'Indiquez le numéro de commande.' }).trim().min(3, 'Indiquez le numéro de commande.').max(20).toUpperCase(),
  type: z.enum(CLAIM_TYPES, { errorMap: () => ({ message: 'Type de problème invalide.' }) }),
  message: z.string({ required_error: 'Décrivez le problème.' }).trim().min(15, 'Décrivez le problème (15 caractères minimum).').max(1000),
  phone: phoneSchema,
});

const serializeClaim = (c) => ({
  id: c.code,
  orderId: c.orderCode,
  type: c.type,
  message: c.message,
  phone: c.phone,
  hasPhoto: Boolean(c.photoPath),
  status: c.status,
  createdAt: c.createdAt.getTime(),
});

export const claimsRouter = Router();
claimsRouter.use(requireAuth('customer'));

claimsRouter.get('/', async (req, res) => {
  const claims = await prisma.claim.findMany({ where: { userId: req.auth.id }, orderBy: { id: 'desc' }, take: 50 });
  res.json({ claims: claims.map(serializeClaim) });
});

claimsRouter.post('/', upload.single('photo'), async (req, res) => {
  try {
    const input = parse(claimSchema, req.body);
    // Rattache la réclamation à la commande si elle appartient bien à ce client.
    const order = await prisma.order.findFirst({ where: { code: input.orderCode, userId: req.auth.id }, select: { id: true } });
    const claim = await prisma.claim.create({
      data: { ...input, code: randomCode('REC'), userId: req.auth.id, orderId: order?.id ?? null, photoPath: req.file?.filename ?? null },
    });
    res.status(201).json({ claim: serializeClaim(claim) });
  } catch (err) {
    if (req.file) await unlink(req.file.path).catch(() => {});
    throw err;
  }
});
