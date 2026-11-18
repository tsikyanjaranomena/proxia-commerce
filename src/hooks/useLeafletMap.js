import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { TILE_LAYERS } from '../utils/leaflet.js';

export function useLeafletMap(containerRef, { center, zoom = 14, interactive = true } = {}) {
  const [map, setMap] = useState(null);
  const initRef = useRef({ center, zoom, interactive });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const { center: c, zoom: z, interactive: i } = initRef.current;
    const m = L.map(el, {
      center: c,
      zoom: z,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: i,
      touchZoom: i,
      doubleClickZoom: i,
      boxZoom: i,
      keyboard: i,
    });
    if (i) L.control.zoom({ position: 'bottomright' }).addTo(m);
    m.attributionControl.setPrefix(false);
    // Molette active uniquement après un clic sur la carte (évite de bloquer le scroll de la page)
    m.on('click', () => m.scrollWheelZoom.enable());
    m.on('mouseout', () => m.scrollWheelZoom.disable());
    let zooming = false;
    m.on('zoomanim', () => { zooming = true; });
    m.on('zoomend', () => { zooming = false; });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el);
    setMap(m);
    return () => {
      ro.disconnect();
      setMap(null);
      // Leaflet n'annule pas son minuteur de fin d'animation de zoom dans remove() :
      // détruire la carte en plein zoom lève une erreur. On attend donc la fin de l'animation.
      if (zooming) m.once('zoomend', () => setTimeout(() => m.remove(), 0));
      else m.remove();
    };
  }, [containerRef]);

  return map;
}

export function useBaseLayer(map, key) {
  useEffect(() => {
    if (!map) return undefined;
    const cfg = TILE_LAYERS[key] || TILE_LAYERS.plan;
    const layers = [L.tileLayer(cfg.url, cfg.options)];
    if (cfg.labels) layers.push(L.tileLayer(cfg.labels, { maxZoom: 19, zIndex: 5 }));
    layers.forEach((l) => l.addTo(map));
    return () => layers.forEach((l) => map.removeLayer(l));
  }, [map, key]);
}
