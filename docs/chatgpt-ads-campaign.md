# ChatGPT Ads — suivi des campagnes Kyrivo (octobre 2026)

## URL à coller dans ChatGPT Ads Manager

https://kyrivo.fr/?utm_source=chatgpt&utm_medium=paid&utm_campaign=kyrivo_vinted_oct2026&utm_content=annonce_a

Personnaliser uniquement utm_campaign et utm_content par campagne / créatif.
Ne PAS inventer `oppref` : OpenAI l'ajoute automatiquement au clic.

## Source Web désormais configurée

Pixel ID public : `Xz1uJN6tAvvzkgpenWANvG` (source « Campagne Kyrivo 1 »). Il est déclaré directement dans `src/lib/openaiAdsConfig.ts` : pas de variable Pixel ID Vercel à créer.

Le SDK est chargé uniquement après accord marketing, puis émet `page_viewed` sur l’accueil, l’inscription, les tarifs et le guide. Les pages de gestion et les données métier ne sont pas envoyées. En mode diagnostic initial, `debug:true` aide à vérifier les événements ; à désactiver après validation.

## Configuration à terminer dans Vercel

Variables d'environnement de Production (et Preview si vous voulez tester) :

- `OPENAI_ADS_CONVERSIONS_API_KEY` : clé secrète Conversions API obtenue dans Ads Manager, à enregistrer **uniquement côté serveur**.

Le menu Conversions d’Ads Manager permet de provisionner la clé. La clé est sensible : la copier dans Vercel côté serveur et ne pas la transmettre via chat, GitHub ou variable NEXT_PUBLIC_.
Après ajout et redéploiement, le statut **Clé Conversions API configurée** apparaît sur `/admin/marketing` pour le propriétaire du compte interne. Ce statut n’est pas un test de livraison ; confirmer par un événement réel dans le flux et les diagnostics.

Ne jamais préfixer la clé API par NEXT_PUBLIC_, ne jamais la déposer dans GitHub.
Après ajout de la clé serveur, redéployer la production pour activer l’API Conversions. La clé n’est pas nécessaire pour le Pixel navigateur.

## Événements envoyés

- `page_viewed` sur les pages publiques principales, après consentement (pixel navigateur).
- `registration_completed` après succès de supabase.auth.signUp (pixel navigateur, consentement obligatoire).
- `trial_started` après succès de signUp (pixel navigateur, consentement obligatoire).
- `checkout_started` après création réussie d'une session de paiement Stripe (pixel navigateur, consentement obligatoire).
- `subscription_created` après webhook Stripe `checkout.session.completed` et écriture réussie de l'abonnement dans Supabase (CAPI serveur, seulement pour nouvelle souscription et consentement enregistré).

Le montant `subscription_created` utilise `session.amount_total` en centimes d'euro, sans valeur estimée.
L'identifiant d'événement CAPI est stable par identifiant d'abonnement Stripe : déduplication des éventuels rejouements.
Si la clé / Pixel ID manque ou si OpenAI échoue, rien ne bloque l'application.

Les UTM sont conservés en session jusqu'à l'inscription ; la source est également figée dans `auth.users.raw_user_meta_data.kyrivo_campaign_attribution` à l'inscription.
Le paramètre `oppref` n'est enregistré qu'après consentement et est transmis sans transformation à OpenAI lorsque disponible.
En cas de refus ou de retrait du consentement, aucun nouvel événement n'est envoyé à OpenAI.

## Rapport interne Kyrivo

https://kyrivo.fr/admin/marketing

Réservé **uniquement au propriétaire du compte interne Kartium TCG** (contrôle serveur Supabase, indépendant du nom d'entreprise affiché).
Le rapport affiche sur 30 jours : visites étiquetées, clics CTA, comptes créés, souscriptions actives attribuées aux nouvelles inscriptions, ventilation par campagne.
Renseigner manuellement les dépenses de la période depuis ChatGPT Ads Manager pour calculer les coûts par visite, inscription et abonné actif. **Ne constitue pas la facturation publicitaire officielle.**

Ne pas interpréter les visites comme clics facturés ou les créations de compte comme des conversions attribuées reconnues par OpenAI : fenêtres d'attribution et modélisation peuvent différer.

## Tests manuels avant dépense publicitaire

1. Navigation privée sans consentement : aucune requête à `bzrcdn.openai.com`.
2. Accepter les cookies marketing. Vérifier le chargement de `oaiq.min.js` et l’événement `page_viewed` dans Ads Manager → Conversions → Flux d’événements.
3. Charger l'URL UTM, cliquer Essai gratuit, vérifier la conservation des UTM vers `/register`.
4. Ouvrir la page `/register` directement avec UTM : source enregistrée sans passage par accueil.
5. Créer un compte neuf non-test. Vérifier les événements `registration_completed` et `trial_started` dans Ads Manager après délai de propagation.
6. Activer un abonnement avec Stripe en mode de test si possible. Vérifier que `subscription_created` arrive une seule fois et que ni les périodes ni les quotas n'ont changé.
7. Retirer le consentement sur `/cookies`, confirmer la disparition des nouveaux événements OpenAI.
8. Ouvrir le rapport en étant connecté au compte administrateur puis tester un compte client : 404 attendu.
9. Comparer les conversions déclarées dans Ads Manager avec les événements internes en tenant compte de la fenêtre d'attribution.

Documentation : https://developers.openai.com/ads/measurement-pixel et https://developers.openai.com/ads/conversions-api.
