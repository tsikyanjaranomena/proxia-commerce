import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Layers } from 'lucide-react';
import { HQ } from '../data/config.js';
import { useLeafletMap, useBaseLayer } from '../hooks/useLeafletMap.js';
import { TILE_LAYERS, pinIcon, riderIcon } from '../utils/leaflet.js';
import { pointAt } from '../utils/navigation.js';
import { orderProgress } from '../utils/orderTimeline.js';

// Le serveur envoie l'avancement environ une fois par seconde : on interpole entre deux mises à jour.
const TWEEN_MS = 1100;

export function MapTracking({ order, geo }) {
  const ref = useRef(null);
  const map = useLeafletMap(ref, { center: [HQ.lat, HQ.lng], zoom: 14 });
  const [base, setBase] = useState('plan');
  const [follow, setFollow] = useState(true);
  useBaseLayer(map, base);

  const layersRef = useRef({});
  const followRef = useRef(follow);
  useEffect(() => {
    followRef.current = follow;
  });

  // Avancement affiché : glisse de la valeur courante vers la dernière valeur reçue du serveur.
  const target = orderProgress(order);
  const shownRef = useRef(target);
  const tweenRef = useRef({ from: target, to: target, t0: 0 });
  useEffect(() => {
    tweenRef.current = { from: shownRef.current, to: target, t0: performance.now() };
  }, [target]);

  const destLat = order.destination.lat;
  const destLng = order.destination.lng;

  // Couches statiques : siège, client, itinéraire, livreur
  useEffect(() => {
    if (!map) return undefined;
    const dest = [destLat, destLng];
    const hq = L.marker([HQ.lat, HQ.lng], { icon: pinIcon('hq', '🏬') }).addTo(map).bindPopup(`<b>${HQ.name}</b><br/>${HQ.address}`);
    const home = L.marker(dest, { icon: pinIcon('home', '🏠') }).addTo(map).bindPopup('<b>Point de livraison</b>');
    const rider = L.marker([HQ.lat, HQ.lng], { icon: riderIcon(), zIndexOffset: 1000 }).addTo(map);
    const extra = [];
    let traveled = null;
    let remaining = null;
    if (geo) {
      extra.push(L.polyline(geo.coords, { color: '#1e3a8a', weight: 10, opacity: 0.25, lineCap: 'round', lineJoin: 'round' }).addTo(map));
      traveled = L.polyline([], { color: '#94a3b8', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      remaining = L.polyline(geo.coords, {
        color: '#2563eb', weight: 6, lineCap: 'round', lineJoin: 'round', dashArray: geo.approximate ? '8 10' : null,
      }).addTo(map);
      map.fitBounds(L.latLngBounds(geo.coords).pad(0.15));
    } else {
      map.fitBounds(L.latLngBounds([[HQ.lat, HQ.lng], dest]).pad(0.3));
    }
    layersRef.current = { rider, traveled, remaining };
    return () => {
      [hq, home, rider, traveled, remaining, ...extra].forEach((l) => l && map.removeLayer(l));
      layersRef.current = {};
    };
  }, [map, geo, destLat, destLng]);

  // Animation fluide du livreur le long du tracé routier
  useEffect(() => {
    if (!map || !geo) return undefined;
    let raf = 0;
    let lastLines = 0;
    let lastPan = 0;
    let drawn = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const { from, to, t0 } = tweenRef.current;
      const p = from + (to - from) * Math.min(1, (now - t0) / TWEEN_MS);
      shownRef.current = p;
      if (p === drawn) return; // rien n'a bougé depuis la dernière image
      drawn = p;
      const { lat, lng, bearing, idx } = pointAt(geo, p * geo.total);
      const { rider, traveled, remaining } = layersRef.current;
      if (rider) {
        rider.setLatLng([lat, lng]);
        const heading = rider.getElement()?.querySelector('.mx-rider-heading');
        if (heading) heading.style.transform = `rotate(${bearing}deg)`;
      }
      const done = p >= 1;
      if (traveled && remaining && (p === to || now - lastLines > 200)) {
        lastLines = now;
        traveled.setLatLngs([...geo.coords.slice(0, idx + 1), [lat, lng]]);
        remaining.setLatLngs([[lat, lng], ...geo.coords.slice(idx + 1)]);
      }
      if (followRef.current && p > 0 && !done && now - lastPan > 1500) {
        lastPan = now;
        map.panTo([lat, lng], { animate: true, duration: 1 });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [map, geo, destLat, destLng]);

  const fitAll = () => {
    if (!map) return;
    setFollow(false);
    const pts = geo ? geo.coords : [[HQ.lat, HQ.lng], [destLat, destLng]];
    map.fitBounds(L.latLngBounds(pts).pad(0.15));
  };

  return (
    <div className="relative">
      <div ref={ref} className="h-[52dvh] min-h-[320px] w-full overflow-hidden rounded-3xl ring-1 ring-slate-200 md:h-[560px]" />
      {/* Fonds de carte */}
      <div className="absolute left-3 top-3 z-[500] flex overflow-hidden rounded-full bg-white/95 p-1 text-xs font-semibold shadow-lg">
        {Object.entries(TILE_LAYERS).map(([k, cfg]) => (
          <button key={k} onClick={() => setBase(k)} className={`rounded-full px-3 py-1.5 ${base === k ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
            {cfg.label}
          </button>
        ))}
      </div>
      {/* Contrôles */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <button
          onClick={() => setFollow((f) => !f)}
          className={`grid h-11 w-11 place-items-center rounded-full shadow-lg ${follow ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
          aria-label={follow ? 'Ne plus suivre le livreur' : 'Suivre le livreur'}
          title="Suivre le livreur"
        >
          <Crosshair className="h-5 w-5" />
        </button>
        <button onClick={fitAll} className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-700 shadow-lg" aria-label="Voir tout l’itinéraire" title="Voir tout l’itinéraire">
          <Layers className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
