import L from 'leaflet';
import { makiSvg } from '../components/brand/maki.js';

export const TILE_LAYERS = {
  // Tuiles publiques OpenStreetMap : sans clé, mais réservées à un usage modéré.
  // Pour un trafic de production, passez à un fournisseur de tuiles avec contrat.
  plan: {
    label: 'Plan',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' },
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 19, attribution: 'Imagerie &copy; Esri' },
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
};

export const pinIcon = (variant, emoji) =>
  L.divIcon({
    className: 'mx-icon',
    html: `<div class="mx-pin mx-pin-${variant}"><span>${emoji}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 46],
    popupAnchor: [0, -44],
  });

export const riderIcon = () =>
  L.divIcon({
    className: 'mx-icon',
    html: '<div class="mx-rider"><div class="mx-rider-pulse"></div><div class="mx-rider-heading"></div><div class="mx-rider-body">' + makiSvg({ headOnly: true }) + '</div></div>',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
