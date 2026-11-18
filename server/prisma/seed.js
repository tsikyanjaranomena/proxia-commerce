import { prisma } from '../src/db.js';
import { hashSecret } from '../src/utils/crypto.js';
import { PRODUCTS } from './seed-data/products.js';
import { RIDERS } from './seed-data/riders.js';

// Code d'accès de démonstration pour l'espace livreur. À changer avant toute mise en production.
const DEMO_RIDER_CODE = process.env.SEED_RIDER_CODE || '2468';

for (const [position, p] of PRODUCTS.entries()) {
  const data = {
    position,
    name: p.name,
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    rating: p.rating,
    reviews: p.reviews,
    stock: p.stock,
    emoji: p.emoji,
    tint: p.tint,
    image: p.image ?? null,
    badge: p.badge ?? null,
    description: p.description,
    specs: JSON.stringify(p.specs),
    tags: JSON.stringify(p.tags ?? []),
    active: true,
  };
  await prisma.product.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
}

// Les produits retirés du catalogue sont masqués, pas supprimés : d'anciennes commandes peuvent y faire référence.
await prisma.product.updateMany({ where: { id: { notIn: PRODUCTS.map((p) => p.id) } }, data: { active: false } });

for (const r of RIDERS) {
  const data = { name: r.name, plate: r.plate, moto: r.moto, rating: r.rating, trips: r.trips };
  await prisma.rider.upsert({
    where: { phone: r.phone },
    create: { phone: r.phone, codeHash: hashSecret(DEMO_RIDER_CODE), ...data },
    update: data,
  });
}

console.log(`Base initialisée : ${PRODUCTS.length} produits, ${RIDERS.length} livreurs (code d'accès livreur : ${DEMO_RIDER_CODE}).`);
await prisma.$disconnect();
