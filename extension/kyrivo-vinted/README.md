# Kyrivo — Extension Chrome Vinted · prototype privé v0.2

Cette version permet de **regrouper plusieurs articles en une seule commande** et de proposer les prix / frais lisibles sur les pages Vinted. **Ce n'est pas une synchronisation complète** : les données sont examinées avant tout enregistrement.

## Installer / mettre à jour sur Chrome ordinateur

1. Décompresser `kyrivo-vinted-chrome-prototype.zip` (fourni en fichier ZIP lors du test).
2. Ouvrir `chrome://extensions`, activer le Mode développeur.
3. Si la v0.1 est présente, cliquer sur **Supprimer** (ou remplacer ses fichiers et cliquer sur **Actualiser**).
4. Cliquer sur « Charger l'extension non empaquetée » et choisir le dossier contenant **manifest.json**.
5. Épingler Kyrivo dans le menu Extensions de Chrome.

## Une commande contenant deux articles

1. Sur Vinted, ouvrir le **récapitulatif de la commande**, puis l'extension et choisir Achat ou Vente.
2. Cliquer sur **Nouvelle commande** et indiquer **2** dans « Nombre d’articles dans cette commande ».
3. Cliquer sur **Ajouter cette page Vinted** pour essayer de relever le prix total, la livraison et les frais de protection. Même si aucun lien d'article n'est exploitable, les montants reconnus seront conservés.
4. Ouvrir la fiche Vinted du **premier article**, puis rouvrir l'extension et cliquer sur **Ajouter cette page Vinted**.
5. Refaire pour le **deuxième article** : la liste de la commande garde les deux fiches.
6. Vérifier les deux titres et les **prix affichés** (corrigeables). Compléter si possible le prix vendeur, la livraison, la protection et le total payé.
7. Cliquer sur **Envoyer cette commande à Kyrivo** : **un seul brouillon** apparaît avec **deux articles distincts**, jamais deux achats séparés.
8. Dans Kyrivo, vérifier la date, les participants, les prix et les frais puis valider manuellement le formulaire. Aucune insertion automatique n'a lieu.

Pour un article seul, mettre le nombre attendu à 1. Pour une commande de X articles, entrer X avant la capture.

## Calculs et limites

- Lorsque le total payé ainsi que les frais de livraison et de protection sont identifiés, Kyrivo **propose** le prix des articles **hors ces frais distincts** : total payé − livraison − protection. Cela ne vaut pas validation fiscale.
- À défaut, Kyrivo peut proposer la **somme des prix visibles** des fiches, en signalant que ceux-ci peuvent différer des montants effectivement payés.
- Si seule une partie des prix unitaires est connue, aucun partage arbitraire du prix de la commande n'est effectué : les champs manquants restent à compléter.
- Les pages Vinted varient suivant les comptes et les pays. En cas de montant manquant ou mal repéré, corriger les champs dans l'extension avant l'envoi, puis dans Kyrivo si besoin.
- Cliquer une fois sur **Nouvelle commande** pour commencer un nouveau lot. Deux commandes distinctes ne doivent pas être fusionnées.
- Capture **sur clic uniquement**, pas de lecture de cookies, mot de passe, jetons ou API privées, ni collecte en arrière-plan.
- Test privé, sans publication sur la page d'import Kyrivo tant que la lecture du site réel n'est pas validée.
