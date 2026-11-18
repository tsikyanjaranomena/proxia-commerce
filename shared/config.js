export const BRAND = 'MadaExpress';

export const HQ = {
  name: 'Siège MadaExpress',
  building: 'Immeuble Galaxy',
  address: 'Immeuble Galaxy, Ankorondrano, Antananarivo 101',
  lat: -18.8776,
  lng: 47.5218,
  phone: '+261 34 00 000 00',
  email: 'support@madaexpress.mg',
  hours: [
    ['Lundi – Samedi', '07h30 – 20h00'],
    ['Dimanche & jours fériés', '08h00 – 13h00'],
  ],
};

export const FREE_DELIVERY_THRESHOLD = 500_000; // Ar

// Le service n'existe qu'à Antananarivo : la livraison est limitée à l'agglomération,
// mesurée à vol d'oiseau depuis le siège (le quartier desservi le plus éloigné est à ≈ 12 km).
export const SERVICE_CITY = 'Antananarivo';

export const MAX_DELIVERY_KM = 15;

export const OUT_OF_ZONE_MESSAGE = `Livraison disponible uniquement à ${SERVICE_CITY} et ses environs (${MAX_DELIVERY_KM} km autour du siège).`;

export const TRAFFIC_FACTOR = 1.25;      // les embouteillages de Tana rallongent l'ETA OSRM

export const PREP_MS = 15_000;           // préparation simulée avant départ du livreur

export const PICKUP_PREP_MS = 30_000;    // préparation simulée d'une commande Click & Collect

export const SIM_SPEEDUP = 6;            // mode démo : le trajet est joué 6× plus vite

export const MIN_RIDE_MS = 60_000;

export const MAX_RIDE_MS = 240_000;

