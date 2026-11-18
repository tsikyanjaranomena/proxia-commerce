/* — Stockage local tolérant aux erreurs (navigation privée, quotas…) — */
export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`mx:${key}`);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`mx:${key}`, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};
