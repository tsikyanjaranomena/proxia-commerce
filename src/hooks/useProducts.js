import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

/** Catalogue chargé depuis l'API (prix et stock font foi côté serveur). */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const { products: list } = await api('/products');
      setProducts(list);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, loading, error, reload };
}
