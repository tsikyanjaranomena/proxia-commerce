import { Baby, Cookie, CupSoda, Package, UtensilsCrossed } from 'lucide-react';

export const ALL_CATEGORIES = 'Tout';

// Les rayons viennent du catalogue (champ `category` des produits) ; seule leur icône est définie ici.
const CATEGORY_ICONS = {
  Alimentation: UtensilsCrossed,
  Enfants: Baby,
  Goûters: Cookie,
  Boissons: CupSoda,
};
export const categoryIcon = (category) => CATEGORY_ICONS[category] || Package;

export const SORTS = [
  { id: 'relevance', label: 'Pertinence' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
];
