# Kyrivo — Extension Chrome Vinted (prototype 0.1)

## Installer pour tester (Chrome ordinateur)

1. Téléchargez le dossier `extension/kyrivo-vinted` depuis le dépôt (ou récupérez le ZIP de test).
2. Ouvrez `chrome://extensions`, activez **Mode développeur**, puis **Charger l'extension non empaquetée**.
3. Sélectionnez le dossier qui contient `manifest.json`. Épinglez l'extension Kyrivo.
4. Ouvrez et connectez-vous vous-même à Vinted, puis affichez une page de votre historique d'achats/ventes où les articles sont visibles.
5. Ouvrez l'extension, sélectionnez **Mes achats** ou **Mes ventes**, cliquez sur **Lire cette page Vinted**.
6. Vérifiez les titres dans l'aperçu et cliquez sur **Envoyer à Kyrivo pour vérification**.
7. Kyrivo s'ouvre sur `/import-vinted?extension=1`. Connectez-vous si besoin, contrôlez chaque brouillon et enregistrez-le manuellement.

## Ce que fait / ne fait pas le prototype

- Lecture **uniquement lors du clic utilisateur** des liens d'articles Vinted rendus dans la page actuelle. Pas de scan de l'historique complet ni d'API non publique.
- Ne demande jamais le mot de passe, ne lit ni cookie ni jeton de session et n'envoie aucune donnée à un serveur depuis l'extension.
- Transfert dans le navigateur à l'onglet Kyrivo ouvert par l'utilisateur. Kyrivo crée seulement des brouillons locaux, jamais une ligne comptable sans validation.
- Les liens d'articles permettent de récupérer titre et prix **affiché** ; ce prix n'est PAS réputé prix payé ou encaissé. Les dates, frais, montants et parties restent à confirmer manuellement.
- Page avec 0 article détecté : rien n'est transféré. La structure visuelle de Vinted change : ce prototype devra être adapté à partir de retours sur des pages réelles.
- Ne permet pas de relister, d'envoyer des messages, ni d'automatiser la navigation ou de contourner les protections de Vinted.
- La version Chrome desktop ne fonctionne pas dans Chrome mobile.

## Sécurité / limites

La capture est stockée temporairement dans `chrome.storage.local` (30 minutes maximum de validité) et effacée après acceptation par Kyrivo. L'extension ne demande que `activeTab`, `scripting`, `storage`; un script spécifique au site Kyrivo assure le transfert.

**Ceci est un prototype expérimental, pas une synchronisation automatique garantie.** Testez d'abord sur votre propre compte et vérifiez les conditions d'utilisation de Vinted avant une diffusion publique.
