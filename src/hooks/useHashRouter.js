import { useCallback, useEffect, useState } from 'react';

export const VIEWS = ['shop', 'cart', 'checkout', 'orders', 'support', 'rider'];

const parseHash = () => {
  const [view, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { view: VIEWS.includes(view) ? view : 'shop', id: id ? decodeURIComponent(id) : null };
};

/** Routage par hash (#/orders/MX-123) : pas de config serveur, bouton retour Android/iOS fonctionnel. */
export function useHashRouter() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((view, id = null) => {
    const hash = `#/${view}${id ? `/${encodeURIComponent(id)}` : ''}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute({ view, id });
    window.scrollTo({ top: 0 });
  }, []);

  return { ...route, navigate };
}
