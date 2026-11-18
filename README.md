# MadaExpress

E-commerce et livraison express à Antananarivo : boutique en Ariary, paiement Mobile Money
(MVola, Orange Money, Airtel Money) ou à la livraison, suivi GPS du livreur en temps réel.

## Démarrer

Prérequis : Node.js 20.12 ou plus récent.

Sur une nouvelle machine, copiez d'abord `server/.env.example` vers `server/.env` et remplacez `JWT_SECRET`
(le fichier `.env` n'est pas versionné).

```bash
npm run setup   # installe les dépendances, crée la base SQLite et le catalogue
npm run dev     # API sur http://localhost:4000, interface sur http://localhost:5173
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | API + interface en développement |
| `npm run lint` | Vérification ESLint (interface, serveur, code partagé) |
| `npm run build` | Construit l'interface dans `dist/` |
| `npm start` | Lance le serveur seul ; il distribue aussi `dist/` s'il existe |
| `npm --prefix server run db:studio` | Explorateur de la base de données |

## Organisation

```
src/        Interface React (pages, components, hooks, services, utils, data)
server/     API Express + Prisma + Socket.IO
  prisma/   Schéma de la base et données initiales (produits, livreurs)
  src/      routes/, services/ (commandes, paiements, suivi), middleware/
shared/     Règles communes aux deux : tarifs par quartier, numéros, constantes
```

Le serveur fait foi : il recalcule prix et frais de livraison, gère le stock, génère et
vérifie le code PIN, calcule l'itinéraire (OSRM) et pousse l'avancement du livreur par WebSocket.

## Mode démo

Actif par défaut hors production (`DEMO_MODE` dans `server/.env`) :

- **Connexion** : aucun SMS n'est envoyé, le code est affiché à l'écran et dans la console du serveur.
- **Paiement** : fournisseur `simulator`, aucun argent ne circule. Le code `0000` simule un solde insuffisant.
- **Livreur** : trajet simulé, joué 6 fois plus vite. Le client peut valider lui-même la remise avec son PIN.
- **Espace livreur** : `/#/rider`, numéro d'un livreur de `server/prisma/seed-data/riders.js`, code d'accès `2468`.
  Un livreur qui partage son GPS remplace la simulation par sa position réelle.

## Passer en production

1. **Base** : dans `server/prisma/schema.prisma`, remplacer `provider = "sqlite"` par `"postgresql"`,
   renseigner `DATABASE_URL`, puis `npm --prefix server run db:setup`.
2. **Secrets** : `JWT_SECRET` long et aléatoire, `DEMO_MODE=false`, `CORS_ORIGIN` sur votre domaine,
   nouveaux codes d'accès livreurs.
3. **SMS** : brancher une passerelle dans `server/src/services/sms.js`.
4. **Mobile Money** : écrire un fournisseur par opérateur selon l'interface décrite dans
   `server/src/services/payments/index.js`, puis régler `PAYMENT_PROVIDER`.
5. **Cartes** : les tuiles OpenStreetMap et le serveur OSRM publics sont réservés à un usage modéré ;
   prévoir un fournisseur de tuiles et une instance OSRM dédiés.
