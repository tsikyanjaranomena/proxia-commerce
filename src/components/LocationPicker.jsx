import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HQ, MAX_DELIVERY_KM } from '../data/config.js';
import { useLeafletMap, useBaseLayer } from '../hooks/useLeafletMap.js';
import { pinIcon } from '../utils/leaflet.js';

export function LocationPicker({ value, onChange }) {
  const ref = useRef(null);
  const map = useLeafletMap(ref, { center: [value.lat, value.lng], zoom: 14 });
  useBaseLayer(map, 'plan');
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!map) return undefined;
    const hq = L.marker([HQ.lat, HQ.lng], { icon: pinIcon('hq', '🏬') }).addTo(map).bindPopup(`<b>${HQ.name}</b><br/>${HQ.address}`);
    // Zone desservie : la carte ne sort pas d'Antananarivo et le périmètre est tracé.
    const zone = L.circle([HQ.lat, HQ.lng], {
      radius: MAX_DELIVERY_KM * 1000, color: '#0e7a4d', weight: 2, dashArray: '6 6', fillOpacity: 0.03, interactive: false,
    }).addTo(map);
    map.setMaxBounds(zone.getBounds().pad(0.25));
    map.setMinZoom(10);
    const marker = L.marker(map.getCenter(), { icon: pinIcon('home', '🏠'), draggable: true, autoPan: true }).addTo(map);
    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      onChangeRef.current({ lat: ll.lat, lng: ll.lng });
    });
    const onClick = (e) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', onClick);
    markerRef.current = marker;
    return () => {
      map.off('click', onClick);
      map.removeLayer(marker);
      map.removeLayer(hq);
      map.removeLayer(zone);
      markerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!map || !marker) return;
    const cur = marker.getLatLng();
    if (Math.abs(cur.lat - value.lat) > 1e-6 || Math.abs(cur.lng - value.lng) > 1e-6) {
      marker.setLatLng([value.lat, value.lng]);
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, value.lat, value.lng]);

  return (
    <div className="relative">
      <div ref={ref} className="h-56 w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 sm:h-64" />
      <p className="pointer-events-none absolute left-2 top-2 z-[500] rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow">
        Touchez la carte ou déplacez 🏠 pour préciser
      </p>
    </div>
  );
}
