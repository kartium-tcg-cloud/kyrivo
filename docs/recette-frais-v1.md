# Kyrivo — Recette avant publication des frais facultatifs (V1)

> Statut : développement PR #16, **pas en production**.
> Conserver l'import Vinted désactivé (hotfix PR #15). Aucun dossier fiscal n'est automatiquement certifié.

## Contrat fonctionnel

1. Cocher **Préférences → Frais et rentabilité** ou l'option de la **configuration rapide** rend accessible « Frais » sur chaque achat et vente existants.
2. Pour une nouvelle opération, on peut cocher « Ajouter des frais après enregistrement » : le formulaire crée normalement l'achat / la vente, puis ouvre la fiche des frais sur l'**identifiant réellement créé**. Une erreur de création ne doit pas ouvrir une fiche orpheline.
3. Un frais dispose d'un libellé, d'une catégorie, d'un TTC, d'un taux informatif, de la TVA, d'une TVA récupérable **déclarée par l'utilisateur**, d'une note et du marqueur « inclus dans le total ».
4. L'option peut être décochée : les frais existants **restent stockés**, comptés dans les exports et dans les indicateurs, mais la saisie est cachée. La réactivation rend les fiches de frais accessibles.
5. **Frais supporté à l'achat** : s'il est déjà inclus dans le total payé, on le mémorise sans créer une deuxième dépense. S'il est payé séparément, il augmente le débours de période. Il n'est **pas encore automatiquement réparti entre les articles du stock**.
6. **Frais supporté à la vente** : réduit la rentabilité économique estimée (montant TTC moins TVA éventuellement récupérable saisie), sans modifier la TVA sur marge ni le total de vente.
7. **Frais déjà facturé au client** : **mémo uniquement**. Il faut d'abord que son montant soit réellement inclus dans la vente et sa facture ; cette fiche ne crée aucune ligne de vente supplémentaire. On ne le rajoute jamais à la recette ou à la marge.
8. Les factures PDF, leur TVA et les numéros ne changent pas lorsque l'on ajoute ou modifie des frais internes. Aucun coût interne n'est imprimé sur une facture client.
9. Le tableau de bord affiche un **solde estimé des flux** et, lorsque les coûts sont connus, une **marge estimée des ventes après frais**, en indiquant le nombre de ventes couvertes. Ces chiffres ne remplacent pas un bilan ni une déclaration TVA.

## Tests chiffrés d'acceptation

| Cas | Achat/frais | Vente | Attendu |
|---|---|---|---|
| Achat avec 8 € de frais déjà inclus | Total achat 108 €, prix fiscal vendeur 100 €, frais 8 € inclus | — | Débours global = 108 € (jamais 116 €) |
| Achat avec 8 € de frais payés à part | Achat 100 €, frais 8 € exclus du total | — | Débours global = 108 € |
| TVA sur marge | Coût fiscal 100 € ; coût économique stock 108 € | 150 € TTC à 20 % | TVA marge = 8,33 € ; marge estimée = 33,67 € avant frais de vente |
| Frais de vente externes | Plus 7 € de frais vendeur non récupérables | 150 € TTC | TVA marge **8,33 € inchangée** ; marge estimée = **26,67 €** |
| Frais facturé au client déjà inclus | Poste client de 6 € présent dans une ligne de vente existante | Total encaissé de 150 € incluant le poste | Total reste 150 €, pas 156 € ; aucun frais supporté fictif |
| TVA récupérable explicitement déclarée | Frais de vente 12 € TTC, TVA récupérable 2 € | Vente marge précédente | Coût net du frais = 10 € ; TVA sur marge **inchangée** |
| Vente à perte et vente gagnante | Fiscal 100 € par article | 80 € TTC et 150 € TTC à 20 % | TVA = 0 € + 8,33 €, sans compenser les marges fiscales |
| Coût d'article inconnu | Ancienne vente sans coût économique vérifiable | — | Indicateur de marge indisponible, **pas 0 € présenté comme vrai résultat** |

## Vérifications fonctionnelles (compte de test avec RLS)

- [ ] Société A : activer l'option dans Préférences, sauvegarder, rafraîchir la page, vérifier sa persistance.
- [ ] Assistant de démarrage : la même préférence est sauvegardée sans écraser les autres paramètres.
- [ ] Achat professionnel multi-articles : frais d'achat inclus puis exclus ; chiffres affichés et export Excel, onglet « Frais achats ».
- [ ] Achat sans stock : frais de transport séparés et total payé inchangé sur la fiche d'achat.
- [ ] Création d'achat avec case « Ajouter des frais après enregistrement » : ouverture sur le bon achat et sauvegarde du frais.
- [ ] Nouvelle vente : case équivalente, vente + mouvement de stock enregistrés avant l'ouverture du modal de frais.
- [ ] Ventes partielles : coûts économiques figés à la vente, frais de vente associés à la bonne vente.
- [ ] Modification et suppression de frais : rapports et Excel actualisés, factures inchangées.
- [ ] Frais client déjà facturé : impossible de comptabiliser un supplément de recette.
- [ ] Désactivation de la préférence : bouton caché ; frais **toujours présents** dans dashboard et export ; réactivation les restitue.
- [ ] Export Excel sur ventes à coûts inconnus : cellule de marge estimée **vide**, jamais estimée au hasard.
- [ ] Société B : aucun accès aux frais de A même en envoyant manuellement les identifiants de A ; tentative INSERT inter-sociétés refusée par FK/RLS.
- [ ] Vérification d'export de 1 002 frais (pagination Supabase).
- [ ] À la création/suppression de frais, le document PDF final et sa TVA restent inchangés.
- [ ] Navigation mobile sur toutes les commandes du modal.

## Avant fusion/déploiement

- **Ne pas fusionner** sans recette manuelle sur compte authentifié et nouvelle compilation Vercel (déploiements quotidiens Hobby bloqués, Pro envisagé par le propriétaire).
- Appliquer la migration du module dans une opération séparée, **seulement** après passage des tests SQL en `BEGIN/ROLLBACK`, vérification RLS et prise d'un point de restauration approprié.
- Publier la version de `main` dont le commit correspond aux fichiers testés ; vérifier Vercel **Production READY** et le domaine `kyrivo.fr`.
- Ne pas prétendre que le montant des frais facturés au client est automatiquement ajouté aux factures.
- Ne pas prétendre que les frais d'achat généraux sont tous répartis dans le coût des articles déjà vendus : une répartition dédiée serait une fonctionnalité additionnelle et nécessite des règles de centimes/historisation.
