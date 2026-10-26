# Thomas × Camille — Studio de contenu

Landing page React/Vite avec direction artistique éditoriale inspirée du Swiss Design et une interface d’administration accessible via `/#admin`.

## Démarrer en local

```bash
npm install
npm run dev
```

Créer un build de production : `npm run build`.

## Administration disponible

- Édition des textes et des prestations
- Prix, listes de livrables et visibilité de sections
- Couleurs, police et largeur du contenu
- URLs d’images et import local d’images
- Liens de contact, WhatsApp, réservation et Instagram
- Enregistrement des réglages dans le stockage local du navigateur

## Avant la mise en production

**Important :** l’administration actuelle est un socle front-end, pas encore un CMS multi-utilisateur sécurisé. Les réglages sont enregistrés dans le navigateur utilisé et ne sont pas partagés avec les visiteurs. Avant de publier pour de vrais clients, connecter un backend (par exemple Supabase) avec authentification administrateur, politiques RLS, stockage privé/public approprié, persistance de la configuration et publication contrôlée. Ne pas considérer le hash `#admin` comme une authentification. Les imports locaux d’images utilisent le stockage navigateur et peuvent atteindre ses limites ; utiliser un stockage média distant pour la production.

Les coordonnées de contact ne sont pas inventées : renseigner les liens réels dans l’administration.
