import { config } from '../config.js';
import { haversine } from '../../../shared/geo.js';

/* — Routage OSRM (itinéraire réel dans les rues d'Antananarivo) — */
export async function fetchOsrmRoute(from, to) {
  const url = `${config.osrmUrl}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM: aucun itinéraire');
    const r = data.routes[0];
    return {
      coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: r.distance,
      duration: r.duration,
      steps: r.legs.flatMap((leg) => leg.steps).map((s) => ({
        distance: s.distance,
        duration: s.duration,
        name: s.name || '',
        type: s.maneuver.type,
        modifier: s.maneuver.modifier || '',
        exit: s.maneuver.exit || null,
      })),
      approximate: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Repli hors-ligne : trajet approximatif (signalé à l'utilisateur). */
export function approximateRoute(from, to) {
  const a = [from.lat, from.lng];
  const b = [to.lat, to.lng];
  const mid = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.12, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.12];
  const coords = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    coords.push([
      (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * mid[0] + t ** 2 * b[0],
      (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * mid[1] + t ** 2 * b[1],
    ]);
  }
  const distance = haversine(a, b) * 1.3;
  return {
    coords,
    distance,
    duration: distance / (20_000 / 3600),
    steps: [
      { distance, duration: 0, name: '', type: 'depart', modifier: '', exit: null },
      { distance: 0, duration: 0, name: '', type: 'arrive', modifier: '', exit: null },
    ],
    approximate: true,
  };
}

export async function getRoute(from, to) {
  try {
    return await fetchOsrmRoute(from, to);
  } catch (err) {
    console.warn('[MadaExpress] OSRM indisponible, itinéraire approximatif :', err);
    return approximateRoute(from, to);
  }
}
