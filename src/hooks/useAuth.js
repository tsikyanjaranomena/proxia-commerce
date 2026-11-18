import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../services/api.js';
import { usePersistentState } from './usePersistentState.js';

/** Session client : connexion par numéro de téléphone + code SMS. */
export function useAuth() {
  const [user, setUser] = usePersistentState('user', null);
  const [token, setTokenState] = useState(getToken);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, [setUser]);

  // Session refusée par le serveur → retour à l'état déconnecté.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const requestOtp = useCallback((phone) => api('/auth/request-otp', { method: 'POST', body: { phone } }), []);

  const verifyOtp = useCallback(
    async (phone, code, name) => {
      const res = await api('/auth/verify-otp', { method: 'POST', body: { phone, code, ...(name && { name }) } });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    },
    [setUser]
  );

  return { user, token, isAuthed: Boolean(token), requestOtp, verifyOtp, logout };
}
