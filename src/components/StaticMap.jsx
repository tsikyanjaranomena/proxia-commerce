import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useLeafletMap, useBaseLayer } from '../hooks/useLeafletMap.js';
import { pinIcon } from '../utils/leaflet.js';

export function StaticMap({ point, label, className = 'h-48' }) {
  const ref = useRef(null);
  const map = useLeafletMap(ref, { center: [point.lat, point.lng], zoom: 16 });
  useBaseLayer(map, 'plan');
  useEffect(() => {
    if (!map) return undefined;
    const m = L.marker([point.lat, point.lng], { icon: pinIcon('hq', '🏬') }).addTo(map);
    if (label) m.bindPopup(label);
    map.setView([point.lat, point.lng], 16);
    return () => map.removeLayer(m);
  }, [map, point.lat, point.lng, label]);
  return <div ref={ref} className={`w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 ${className}`} />;
}
