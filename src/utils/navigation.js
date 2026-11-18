import { haversine, bearingDeg } from './geo.js';

/** Pré-calcule les distances cumulées pour l'animation et le guidage. */
export function buildGeo(route) {
  if (!route?.coords?.length) return null;
  const { coords } = route;
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  const total = cum[cum.length - 1] || 1;
  const stepsTotal = route.steps.reduce((acc, s) => acc + s.distance, 0) || total;
  const k = total / stepsTotal;
  let acc = 0;
  const steps = route.steps.map((s) => {
    const step = { ...s, startDist: acc * k };
    acc += s.distance;
    return step;
  });
  return { coords, cum, total, steps, duration: route.duration, approximate: route.approximate };
}

export function pointAt(geo, d) {
  const { coords, cum } = geo;
  const n = coords.length - 1;
  if (n <= 0) return { lat: coords[0][0], lng: coords[0][1], bearing: 0, idx: 0 };
  if (d <= 0) return { lat: coords[0][0], lng: coords[0][1], bearing: bearingDeg(coords[0], coords[1]), idx: 0 };
  if (d >= cum[n]) return { lat: coords[n][0], lng: coords[n][1], bearing: bearingDeg(coords[n - 1], coords[n]), idx: n };
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const t = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
  const a = coords[lo];
  const b = coords[hi];
  return { lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t, bearing: bearingDeg(a, b), idx: lo };
}

export function nextManeuver(geo, d) {
  if (!geo?.steps?.length) return null;
  for (let i = 0; i < geo.steps.length; i++) {
    const s = geo.steps[i];
    if (s.startDist > d + 5) return { step: s, index: i, distance: s.startDist - d };
  }
  const last = geo.steps[geo.steps.length - 1];
  return { step: last, index: geo.steps.length - 1, distance: Math.max(0, geo.total - d) };
}

export const MODIFIER_FR = {
  left: 'à gauche', right: 'à droite', 'slight left': 'légèrement à gauche', 'slight right': 'légèrement à droite',
  'sharp left': 'franchement à gauche', 'sharp right': 'franchement à droite', straight: 'tout droit', uturn: 'demi-tour',
};

export function instructionFr(step) {
  const on = step.name ? ` sur ${step.name}` : '';
  const m = MODIFIER_FR[step.modifier] || '';
  switch (step.type) {
    case 'depart':
      return `Départ${step.name ? ` par ${step.name}` : ' du siège'}`;
    case 'arrive':
      return 'Arrivée à destination';
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn':
      return step.exit ? `Au rond-point, prenez la ${step.exit}${step.exit === 1 ? 're' : 'e'} sortie${on}` : `Prenez le rond-point${on}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Sortez du rond-point${on}`;
    case 'fork':
      return `À l’embranchement, restez ${m || 'sur la voie'}${on}`;
    case 'end of road':
      return `Au bout de la route, tournez ${m}${on}`;
    case 'merge':
      return `Rejoignez la voie${on}`;
    default:
      if (step.modifier === 'uturn') return `Faites demi-tour${on}`;
      if (!step.modifier || step.modifier === 'straight') return `Continuez tout droit${on}`;
      return step.type === 'turn' ? `Tournez ${m}${on}` : `Continuez ${m}${on}`;
  }
}
