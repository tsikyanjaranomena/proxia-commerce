import { Router } from 'express';
import { prisma } from '../db.js';

const serializeProduct = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  oldPrice: p.oldPrice,
  rating: p.rating,
  reviews: p.reviews,
  stock: p.stock,
  emoji: p.emoji,
  tint: p.tint,
  image: p.image,
  badge: p.badge,
  description: p.description,
  specs: JSON.parse(p.specs),
  tags: JSON.parse(p.tags),
});

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { position: 'asc' } });
  res.json({ products: products.map(serializeProduct) });
});
