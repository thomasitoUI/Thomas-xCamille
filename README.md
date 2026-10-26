# Thomas × Camille — Studio de contenu

Landing page React/Vite, direction artistique éditoriale inspirée du Swiss Design et espace d’administration via `/#admin`.

## Démarrer en local

```bash
npm install
cp .env.example .env
npm run dev
```

Sans configuration Supabase, l’administration reste en mode local de démonstration : les réglages sont stockés uniquement dans le navigateur. Ce mode ne doit pas être utilisé comme CMS de production.

## Connecter Supabase

1. Créez un projet Supabase et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans votre environnement local ou les variables d'environnement du service de déploiement. N'utilisez jamais une clé `service_role` ou une clé secrète dans le navigateur.
2. Exécutez `supabase/migrations/202610260001_site_settings.sql` dans le SQL Editor du projet. La migration crée la table de configuration, active RLS, attribue les droits explicites et prépare le bucket public `site-media` avec écriture limitée aux administrateurs.
3. Dans Supabase Auth, créez un compte pour l'administrateur. Attribuez le rôle via `app_metadata` (jamais `user_metadata`) : `{ "role": "admin" }`. Ce rôle doit être défini par un administrateur de confiance côté serveur ou dans le dashboard ; il ne doit pas être modifiable par le client. Déconnectez-vous/reconnectez-vous après la modification afin de renouveler le JWT.
4. Configurez les URL de redirection Auth pour les domaines de développement et de production.
5. Si la table n'apparaît pas dans les appels REST malgré les GRANT, vérifiez dans Supabase Dashboard > Integrations > Data API que la table `public.site_settings` est exposée. Les nouveaux projets ne l'exposent plus automatiquement.
6. Définissez les variables d'environnement sur le service de déploiement puis redéployez.

## Fonctionnalités

- Contenu éditorial, offres, tarifs, prestations et visibilité des sections
- Palette, police, largeur de contenu
- Import des images dans Supabase Storage quand le backend est configuré
- Liens de contact et réseaux sociaux
- Connexion administrateur Supabase et persistance distante de la configuration
- RLS : lecture publique de la configuration publiée ; écriture réservée aux JWT dont `app_metadata.role = admin`

## Limites à connaître

- L'administration n'est réellement protégée que lorsque les variables Supabase sont configurées. Le mode local de démonstration est volontairement non sécurisé.
- Les images importées dans le bucket public sont publiquement lisibles par URL ; seules les écritures sont réservées aux administrateurs.
- Le contrôle de compilation est défini dans GitHub Actions. Vérifiez le résultat de la dernière exécution avant de publier.
- Les coordonnées sont vides par défaut : renseignez les vraies coordonnées dans l'administration.
