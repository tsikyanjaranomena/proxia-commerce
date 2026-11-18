import { z } from 'zod';
import { OPERATORS } from '../../../shared/operators.js';
import { isValidPhone, normalizePhone } from '../../../shared/phone.js';

export const phoneSchema = z
  .string({ required_error: 'Numéro de téléphone requis.', invalid_type_error: 'Numéro de téléphone invalide.' })
  .transform(normalizePhone)
  .refine(isValidPhone, 'Numéro de téléphone invalide (ex. 034 12 345 67).');

export const pinSchema = z.object({
  pin: z.string({ required_error: 'Code PIN requis.' }).regex(/^\d{4}$/, 'Le code PIN comporte 4 chiffres.'),
});

export const mobilePaymentSchema = z
  .object({
    operator: z.enum(Object.keys(OPERATORS), { errorMap: () => ({ message: 'Opérateur Mobile Money inconnu.' }) }),
    phone: phoneSchema,
  })
  .refine((p) => OPERATORS[p.operator].prefixes.includes(p.phone.slice(0, 3)), {
    message: 'Ce numéro ne correspond pas à l’opérateur choisi.',
  });

export const orderSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string().min(1).max(40),
          qty: z.number().int().min(1, 'Quantité invalide.').max(99, 'Quantité invalide.'),
        }),
        { required_error: 'Votre panier est vide.' }
      )
      .min(1, 'Votre panier est vide.')
      .max(50, 'Trop d’articles dans le panier.'),
    reception: z.enum(['delivery', 'pickup'], { errorMap: () => ({ message: 'Mode de réception invalide.' }) }),
    destination: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
    address: z.string().trim().max(300, 'Adresse trop longue.').optional(),
    customer: z.object({
      name: z.string().trim().min(2, 'Indiquez votre nom.').max(80, 'Nom trop long.'),
      phone: phoneSchema,
    }),
    payment: z.discriminatedUnion(
      'method',
      [
        z.object({ method: z.literal('cod') }),
        z.object({ method: z.literal('mobile'), operator: z.string(), phone: z.string() }),
      ],
      { errorMap: () => ({ message: 'Mode de paiement invalide.' }) }
    ),
  })
  .superRefine((order, ctx) => {
    if (order.reception === 'delivery') {
      if (!order.destination) ctx.addIssue({ code: 'custom', message: 'Position de livraison manquante.' });
      if (!order.address || order.address.length < 5) {
        ctx.addIssue({ code: 'custom', message: 'Précisez l’adresse ou un repère (lot, portail, couleur…).' });
      }
    }
  });
