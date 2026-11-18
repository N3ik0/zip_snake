# Zip Snake — POC

Puzzle mobile : un serpent doit manger les fruits **dans l'ordre** (1, 2, 3…) et **remplir toutes les cases** d'un seul tracé (mécanique type « Zip » de LinkedIn).

Stack : TypeScript, React 19, Vite, Capacitor 8 (Android, iOS plus tard), Vitest.

## Démarrage rapide

```bash
nvm use            # Node 22 (voir .nvmrc) — Node >= 20 requis
npm install
npm run dev        # http://localhost:5173 — jouable à la souris, au doigt ou aux flèches du clavier
```

Contrôles : glisser depuis le fruit 1 ; repasser sur le serpent le fait reculer ; flèches du clavier + Retour arrière sur desktop. L'ampoule donne un indice (une étoile de moins).

## Scripts (à la racine)

| Commande                  | Rôle                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Serveur de dev de l'app                                       |
| `npm run test`            | Tous les tests (moteur + app)                                 |
| `npm run typecheck`       | Vérification TypeScript stricte                               |
| `npm run lint`            | ESLint                                                        |
| `npm run check`           | lint + typecheck + tests + build (à lancer avant chaque push) |
| `npm run generate:levels` | Régénère les 200 niveaux (déterministe)                       |
| `npm run build`           | Build de production dans `apps/snake/dist`                    |

## Architecture

```
packages/
  core/          Briques génériques sans framework : RNG déterministe, géométrie de grille.
                 Réutilisable par le futur jeu domino.
  zip-engine/    Toute la logique du jeu, en TypeScript pur (aucune dépendance React) :
                 - board.ts      modèle + LA règle de déplacement (canStep), partagée joueur/solveur
                 - solver.ts     recherche en profondeur avec élagages (connexité, culs-de-sac)
                 - hamiltonian.ts chemin aléatoire couvrant toute la grille (algorithme « backbite »)
                 - generator.ts  chemin -> numéros/murs jusqu'à solution unique -> minimisation -> indices
                 - game.ts       état du joueur (tracé, recul, interpolation des glissés rapides)
                 - level.ts      format des niveaux, validation JSON, vérification d'unicité
apps/
  snake/         App React + Capacitor : carte des niveaux (3 zones, progression débloquée),
                 plateau SVG (components/board/ : serpent, fruits, clôtures, cadre, effets),
                 indices et étoiles, sons synthétisés, vibrations, progression sauvegardée.
scripts/
  generate-levels.ts  Génère apps/snake/src/levels/levels.json (60 faciles 5x5, 70 moyens 6x6, 70 difficiles 7x7)
```

Principes : la logique vit dans `zip-engine` et est testée sans navigateur ; l'app n'est qu'un adaptateur (hooks React). Changer de framework (Expo, par ex.) ne toucherait que `apps/snake`.

## Qualité

- Le solveur est vérifié contre une énumération brute force sur des centaines de grilles aléatoires.
- Chaque niveau livré est re-vérifié par les tests (chemin légal + **solution unique**).
- Test de bout en bout React : un niveau est résolu au clavier, victoire, progression, niveau suivant.

## Android

Prérequis : Android Studio (avec SDK) et un téléphone en mode développeur, ou un émulateur.

```bash
npm run build
cd apps/snake
npx cap sync android     # copie le build web dans le projet Android
npx cap open android     # ouvre Android Studio -> bouton Run
# ou directement : npx cap run android
```

Avant toute publication : changer `appId` dans `apps/snake/capacitor.config.ts` (définitif sur le Play Store).

## Régénérer / ajuster les niveaux

Les paramètres par palier (taille, nombre d'indices, probabilité de murs) sont en tête de `scripts/generate-levels.ts`. Même config = même fichier, donc les diffs git restent lisibles.

## Hors POC (prochaines étapes)

Pubs AdMob + consentement RGPD, puzzle quotidien + partage du résultat, skins de serpent, visuels IA, analytics, puis iOS via un service de build cloud.
