import { useCallback, useMemo } from 'react';
import { usePersistentState } from './usePersistentState.js';

/** Panier persistant { [productId]: quantité }, résolu avec le catalogue du serveur. */
export function useCart(products) {
  const [cart, setCart] = usePersistentState('cart', {});

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
        .filter((l) => l.product && l.qty > 0),
    [cart, products]
  );
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * l.product.price, 0);

  const add = useCallback(
    (product, qty = 1) => setCart((c) => ({ ...c, [product.id]: Math.min(product.stock, (c[product.id] || 0) + qty) })),
    [setCart]
  );
  const setQty = useCallback(
    (id, qty) =>
      setCart((c) => {
        const next = { ...c };
        if (qty <= 0) delete next[id];
        else next[id] = qty;
        return next;
      }),
    [setCart]
  );
  const remove = useCallback((id) => setQty(id, 0), [setQty]);
  const clear = useCallback(() => setCart({}), [setCart]);

  return { lines, count, subtotal, add, setQty, remove, clear };
}
