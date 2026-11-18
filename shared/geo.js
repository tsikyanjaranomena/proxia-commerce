import { HQ } from './config.js';
import { QUARTIERS } from './quartiers.js';

/* — Géographie — */
export const toRad = (d) => (d * Math.PI) / 180;

export function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function bearingDeg([lat1, lng1], [lat2, lng2]) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const distanceFromHQ = (p) => haversine([HQ.lat, HQ.lng], [p.lat, p.lng]);

/** Tarification dynamique : prise en charge + coût kilométrique (distance routière estimée ≈ 1,3 × vol d'oiseau). */
export function deliveryFeeFor(point) {
  const km = distanceFromHQ(point) / 1000;
  const raw = 1500 + km * 1.3 * 700;
  return Math.max(2000, Math.ceil(raw / 500) * 500);
}

export const zoneFor = (point) => {
  const km = distanceFromHQ(point) / 1000;
  return km < 3 ? 'Zone 1' : km < 7 ? 'Zone 2' : 'Zone 3';
};

export const nearestQuartier = (point) =>
  QUARTIERS.reduce((best, q) => {
    const d = haversine([q.lat, q.lng], [point.lat, point.lng]);
    return d < best.d ? { q, d } : best;
  }, { q: QUARTIERS[0], d: Infinity }).q;
