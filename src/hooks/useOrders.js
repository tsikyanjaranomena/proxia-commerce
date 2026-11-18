import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { connectSocket } from '../services/socket.js';
import { isActiveOrder } from '../utils/orderTimeline.js';

const post = (path, body) => api(path, { method: 'POST', body });

/**
 * Commandes du client connecté. La liste vient de l'API ; les changements d'état
 * et la position du livreur arrivent ensuite en temps réel par WebSocket.
 */
export function useOrders(token) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));

  // Fusionne une commande reçue en conservant ce que l'on a déjà (l'itinéraire n'est envoyé qu'avec le détail).
  const upsert = useCallback((order) => {
    setOrders((prev) => {
      const i = prev.findIndex((o) => o.id === order.id);
      if (i === -1) return [order, ...prev];
      const next = [...prev];
      next[i] = { ...prev[i], ...order };
      return next;
    });
    return order;
  }, []);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return undefined;
    }

    let alive = true;
    const load = async () => {
      try {
        const { orders: list } = await api('/orders');
        if (!alive) return;
        setOrders((prev) => {
          const ids = new Set(list.map((o) => o.id));
          // Une commande créée pendant le chargement n'est pas encore dans la liste : on la garde.
          const fresh = prev.filter((p) => !ids.has(p.id));
          return [...fresh, ...list.map((o) => ({ ...prev.find((p) => p.id === o.id), ...o }))];
        });
      } catch {
        /* la liste sera rechargée à la prochaine connexion */
      } finally {
        if (alive) setLoading(false);
      }
    };
    setLoading(true);
    load();

    const socket = connectSocket(token);
    let connectedOnce = false;
    socket.on('connect', () => {
      if (connectedOnce) load(); // reconnexion : rattrape les événements manqués
      connectedOnce = true;
    });
    socket.on('order:update', upsert);
    socket.on('order:progress', ({ id, progress }) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, progress } : o)));
    });

    return () => {
      alive = false;
      socket.disconnect();
    };
  }, [token, upsert]);

  /** Détail d'une commande, itinéraire routier compris. */
  const loadOrder = useCallback(async (id) => upsert((await api(`/orders/${encodeURIComponent(id)}`)).order), [upsert]);

  /** Crée la commande. Retourne { order, payment } ; `payment` est renseigné pour le Mobile Money. */
  const createOrder = useCallback(
    async (payload) => {
      const res = await post('/orders', payload);
      upsert(res.order);
      return res;
    },
    [upsert]
  );

  const retryPayment = useCallback(async (id, mobile) => (await post(`/orders/${encodeURIComponent(id)}/pay`, mobile)).payment, []);
  const cancelOrder = useCallback(async (id) => upsert((await post(`/orders/${encodeURIComponent(id)}/cancel`)).order), [upsert]);
  const confirmDelivery = useCallback(
    async (id, pin) => upsert((await post(`/orders/${encodeURIComponent(id)}/confirm-delivery`, { pin })).order),
    [upsert]
  );
  const simulatePayment = useCallback(async (paymentId, scenario) => (await post(`/payments/${paymentId}/simulate`, { scenario })).payment, []);
  const checkPayment = useCallback(async (paymentId) => (await api(`/payments/${paymentId}`)).payment, []);

  const activeCount = orders.filter(isActiveOrder).length;

  return { orders, loading, activeCount, loadOrder, createOrder, retryPayment, cancelOrder, confirmDelivery, simulatePayment, checkPayment };
}
