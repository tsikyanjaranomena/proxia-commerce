export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const normalizeText = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const formatDist = (m) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (date) =>
  new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const randomDigits = (n) => {
  const arr = new Uint32Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v % 10).join('');
};

export const randomId = (prefix) => `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${randomDigits(3)}`;
