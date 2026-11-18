import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

/** Réclamations du client connecté. */
export function useClaims(token) {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    if (!token) {
      setClaims([]);
      return undefined;
    }
    let alive = true;
    api('/claims')
      .then((res) => alive && setClaims(res.claims))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);

  /** `form` est un FormData (champs + photo éventuelle). */
  const submitClaim = useCallback(async (form) => {
    const { claim } = await api('/claims', { method: 'POST', body: form });
    setClaims((prev) => [claim, ...prev]);
    return claim;
  }, []);

  return { claims, submitClaim };
}
