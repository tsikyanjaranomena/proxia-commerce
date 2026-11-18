import { Bike, Clock, ClipboardList, Info, Package, Wallet } from 'lucide-react';

export const CLAIM_TYPES = [
  { id: 'retard', label: 'Retard de livraison', icon: Clock },
  { id: 'abime', label: 'Produit abîmé', icon: Package },
  { id: 'livreur', label: 'Litige avec le livreur', icon: Bike },
  { id: 'erreur', label: 'Erreur de commande', icon: ClipboardList },
  { id: 'paiement', label: 'Problème de paiement', icon: Wallet },
  { id: 'autre', label: 'Autre', icon: Info },
];

export const FAQ = [
  ['Quels sont les délais de livraison ?', 'En moyenne 30 à 60 minutes dans Antananarivo selon le quartier et la circulation. Le suivi GPS vous indique l’heure d’arrivée en temps réel.'],
  ['Comment fonctionne le paiement Mobile Money ?', 'Saisissez votre numéro MVola, Orange Money ou Airtel Money. Vous recevez une demande de paiement sur votre téléphone : validez-la avec votre code secret. Vous pouvez aussi composer le code USSD de votre opérateur.'],
  ['À quoi sert le code PIN ?', 'Il sécurise la remise : ne communiquez votre code à 4 chiffres qu’au livreur, une fois le colis en main. Sans ce code, la livraison ne peut pas être clôturée.'],
  ['Puis-je payer en espèces ?', 'Oui, choisissez « Paiement à la livraison ». Merci de prévoir l’appoint en Ariary, nos livreurs ont peu de monnaie.'],
];
