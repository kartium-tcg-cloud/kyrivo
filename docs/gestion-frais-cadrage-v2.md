# Kyrivo — Frais, TVA et rentabilité : cadrage fonctionnel v2
**Date : 17 octobre 2026 • Statut : spécification en cours de validation fiscale, non déployée**

## 1. Finalité et périmètre

L'option **Préférences → Frais et rentabilité** (« Je souhaite pouvoir ajouter des frais à mes achats et à mes ventes »), **désactivée par défaut**, permettra :
1. les **frais supportés à l'achat** (port fournisseur distinct, protection acheteur, commissions, taxes spécifiques, emballages) ;
2. les **frais supportés à la vente** (étiquette d'envoi payée par l'entreprise, commission PayPal/marketplace, emballage) ;
3. les **frais facturés au client** (port ou frais de service ajoutés à la vente) — **recettes**, pas charges.

Chaque frais possède un type explicite, une catégorie, une désignation, un montant, une éventuelle TVA, une note, sa facture/son justificatif et un marqueur **« déjà inclus dans le total »**. Désactiver l'option masque la saisie, **sans supprimer l'historique**.

L'application ne doit jamais additionner deux fois un port ou une commission déjà compris dans la somme importée (notamment sur Vinted).

## 2. Quatre grandeurs à ne jamais confondre

- **Prix d'achat fiscal** : prix obtenu par le fournisseur en contrepartie de la vente du bien, selon justificatif et termes du contrat (ex. « départ » ou « franco »). Utilisé, pour un bien admissible, comme dénominateur dans la **TVA sur marge**. Les frais d'acheteur payés séparément ne l'augmentent pas automatiquement.
- **Coût économique d'acquisition** : prix fournisseur + coûts indirects affectés au stock, **nets de TVA récupérable quand le droit existe**, selon la politique d'imputation. Sert aux indicateurs de rentabilité et éventuellement à la valorisation du stock, jamais de substitution au prix fiscal de la TVA sur marge.
- **Flux financier / caisse** : montant réellement payé au fournisseur, au transporteur, à la plateforme et reçu du client ; doit éviter doubles sommes « frais inclus ».
- **Prix de vente fiscal / montant facturé au client** : prix des biens + frais accessoires exigés du client (transport, emballage, service), selon règles applicables. Ces frais participent généralement à la base de TVA sous régime standard et, sous régime de marge, augmentent le prix de vente utilisé pour la marge taxable.

**Nuance absolue :** « aucun frais n'entre jamais dans le prix d'achat fiscal » serait faux. Lorsqu'un prix fournisseur est convenu « franco », le transport supporté par le vendeur peut faire partie du prix d'achat fiscal. La qualification dépend de la facture et des conditions de vente ; ne pas décider uniquement à partir de la catégorie du frais.

## 3. Régime fiscal explicite — par société et selon la date

Le paramètre historique `default_vat_rate = 0` **ne prouve pas** qu'une entreprise est en franchise. Créer un choix explicite et historisé, avec pays, régime et date d'effet :
- **Franchise / franchise en base**, BE ou FR : TVA non facturée au client, **TVA sur dépenses non déductible** ; ne pas calculer de TVA sur marge pour les ventes de ce régime. Suivi d'un chiffre d'affaires utile aux seuils légaux, avec règles locales (année civile, seuils et changements de régime) sans annoncer de déclaration fiscale automatique.
- **Régime normal TVA** : ventes standard possibles et régime TVA sur marge **par vente / article admissible**. La TVA des services/frais professionnels peut être déductible, uniquement selon justificatif et conditions de déduction.
- **Autoliquidation / reverse charge** : c'est un **mode de TVA sur une dépense spécifique**, pas un régime fiscal global ; une société franchisée peut devoir acquitter la TVA sur des prestations intracommunautaires sans pouvoir la déduire. À distinguer de « sans TVA / exonéré » et de « taux 0 % ». Mentionner clairement « traitement à valider avec un comptable ».

Les documents de vente émis doivent **figer le régime fiscal applicable à la date de la transaction** (snapshot), sans se modifier quand les Préférences changent.

## 4. Calculs de TVA sur marge : un article ne compense pas un autre

Dans le mode au coup par coup, appliquer les calculs **par ligne/article fiscalement distinct**, non sur la somme de marges gagnantes et perdantes :

```text
marge_ttc_fiscale = prix_de_vente_fiscal_ttc - prix_achat_fiscal_eligible
base_ttc_taxable   = max(0, marge_ttc_fiscale)
tva_sur_marge      = arrondi(base_ttc_taxable * taux / (100 + taux))
marge_economique   = encaissements_pertinents - couts_economiques_affectes
                      - frais_de_vente_supportes - TVA_due_eventuelle
```

Une perte économique reste **négative** même si la TVA de la ligne est plafonnée à zéro.

**Contrôles :** vente partielle, retour, article vendu en plusieurs unités, arrondis au centime et frais de port client couvrant plusieurs biens / plusieurs taux. Pour frais facturés sur une facture multirégime, **ne pas appliquer aveuglément un taux global** : allocation justifiée par bien et taux, ou facture séparée lorsque le régime l'exige.

La **globalisation optionnelle des marges en France** (périodes/stock) est une fonctionnalité distincte, **hors périmètre V1**, et ne doit pas interférer avec le calcul au coup par coup.

**Port facturé au client sur une vente contenant plusieurs biens** :
- affecter son montant TTC aux **articles au prorata de leur prix de vente TTC**, en centimes entiers ;
- répartir les restes d'arrondi selon une règle stable (les plus grands restes, puis ordre de ligne) pour que la somme allouée soit **exactement** le montant de port facturé ;
- ajouter la part allouée au **prix de vente fiscal de chaque article** avant l'application du plancher individuel `max(0, marge)` ;
- en cas d'articles relevant de **taux différents** ou de régimes distincts (marge et normal), déterminer séparément les montants/taux applicables ; ne **jamais** appliquer une TVA unique à l'ensemble du port ni compenser les pertes d'un article avec les bénéfices d'un autre ;
- conserver la ventilation par article dans les données de vente/facture pour permettre contrôle et export.

**Tests prioritaires** : deux articles à gains/pertes opposés ; port réparti en euros et centimes, dont arrondis résiduels ; combinaison de plusieurs taux ; plusieurs régimes (marge/normal) dans un même panier ; facture sans port ; port remboursé ou modifié. Le formulaire actuel exige encore des factures séparées pour marge et normal : prendre en charge le panier mixte seulement lorsque la ventilation sera validée.

## 5. Décisions fonctionnelles proposées

| Sujet | V2 proposée | Garde-fou |
|---|---|---|
| Stockage des coûts | Prix fiscal par article + coût économique affecté / non affecté | Ne jamais utiliser le total Vinted comme prix fiscal sans validation |
| Saisie | **TTC par défaut**, calcul inversé de la TVA ; HT optionnel en régime normal | En franchise, saisie TTC de dépense et taux de TVA payé renseignable seulement pour information, récupération forcée à 0 |
| Charges d'achat | Rattachées **au document** par défaut | Répartition en coût économique par article **sur demande** |
| Charges de vente | Rattachées à la vente, interne et non visible sur facture | Montant/TVA récupérable distincts ; réduction marge économique sans réduction automatique base marge TVA |
| Port facturé client | **Ligne facture séparée**, incluse dans le total client et dans le prix de vente fiscal pertinent | Déterminer taux selon biens, pays et régime ; zéro double comptage |
| Mode « débours » | **Non proposé** au démarrage | Un port acquis au nom du revendeur et refacturé n'est pas un débours art. 79 c |
| Commissions financières | Classification **sans TVA / exonération** possible | Ne pas confondre 0 %, exonération et hors champ |
| Commission UE | Classification **autoliquidation** possible | Calcul de taxe due ≠ TVA déductible, notamment franchise |
| Justificatifs | Lien documentaire par frais dans phase suivante | Exiger justificatif pour déduction automatique, sinon « à vérifier » |

Les choix proposés sont à **confirmer avant application de la migration**.

## 6. Modèle de données et évolution de la PR #10 (non validée)

### Société
- `company_preferences.enable_transaction_fees: boolean NOT NULL DEFAULT false`.
- Nouveau profil régime TVA avec **pays**, `regime`, `effective_from`, et dates / historique, plutôt qu'inférer depuis un taux.
- Prévoir un **snapshot du régime** lors de la vente et du document émis.

### Achats et stock
- Ajouter un prix fournisseur fiscal **explicite**, par unité/lot : `fiscal_purchase_price` (nullable pour les historiques non vérifiés).
- Conserver séparément `economic_purchase_cost` et `paid_total` (ou leurs composantes), avec ventilation éventuelle par article.
- Ne **pas réinterpréter silencieusement** les anciennes colonnes `purchase_items.unit_cost`, `purchase_items.total_cost`, `sale_lines.purchase_cost`.
- Identifier `origin` de l'achat : Vinted, manuel, import, autre ; `components_verified`, `legacy_cost_review_required`.

### Registre de frais
L'ébauche `transaction_fees` de la PR #10 doit être **revue avant migration**. Elle fournit : type dépense/recette, document parent, montant HT/TVA/TTC, notes, `included_in_parent_total`, RLS par société.
À ajouter/refondre :
- Taxation du **frais supporté** : `vat_treatment` = `taxable`, `vat_exempt`, `no_vat`, `reverse_charge`, `outside_scope`, `unknown`. TVA due en autoliquidation **distincte** de TVA déductible. Ne pas regrouper dans un seul enum avec « marge accessoire », qui est un régime **de recette**.
- Taxation du **frais refacturé** calculée d'après la **vente**, le pays, le régime et les articles (standard/marge/franchise), en conservant la ventilation nécessaire aux taux mixtes.
- Ajouts de sources, justificatifs, provenance et allocation de charge aux articles vendus.
- Contrainte sur les documents déjà facturés : interdit de modifier les totaux d'une facture émise sans avoir traité le cas via un document rectificatif.

### Sécurité et fiabilité
- Contrôles serveur RLS et FK composites `(company_id, purchase_id/sale_id)`, limites de longueur et montants positifs.
- Écritures **atomiques côté serveur**, avec vente + lignes + stock + frais : la gestion actuelle client-side par étapes avec rollback « best effort » n'offre pas une véritable transaction DB.
- Argent en unités entières de centimes pour les sommes/applications, sans dérive des arrondis ; TVA calculée au niveau légal (ligne/article), pas de base recomposée avec marges négatives croisées.

## 7. Bug Vinted confirmé (priorité préalable)

Chaîne vérifiée :
`VintedImportModal.handleCreer → AchatItemInput.cout = total payé → buildPurchaseItems → purchase_items.unit_cost → getAvailableStockItems → VenteFormModal.purchaseCost → calculateMarginVAT`.

**Conséquence :** en régime marge, les frais externes ajoutés au prix vendeur peuvent réduire artificiellement la marge taxable.

**Exemple :** vendeur 100 €, port distinct 5 €, protection acheteur 3 €, vente 150 € à 20 %. Valeur fiscale 100 €, valeur économique 108 €.

| Valeur | Calcul actuel erroné | Calcul fiscal corrigé |
|---|---:|---:|
| TVA sur marge due | 7,00 € | **8,33 €** |
| Marge commerciale **avant** TVA (150 – 108) | 42,00 € | 42,00 € |
| Marge économique **après** TVA (150 – 108 – TVA due) | 35,00 € | **33,67 €** |

**La rentabilité nette de TVA n'est PAS 42 €** : l'écart de 1,33 € entre les deux dernières colonnes représente la TVA sur marge non intégrée à la marge économique si le prix fiscal est surévalué. Aucune autre charge n'est retenue dans cet exemple.

**Historique** :
- Audit de lecture seule complémentaire : **23 achats ont `payment_method='Vinted'` et 30 lignes d'articles Vinted sont encore en stock** (17/10/2026). Ce critère n'identifie PAS avec certitude le mode d'import : l'utilisateur a pu créer manuellement un achat puis choisir Vinted. Aucun prix existant n'est modifié, y compris pour ce stock.
- Marquer les articles Vinted candidats non vérifiés pour revue, en laissant le prix historique intact. Si des justificatifs ou les commentaires conservent les montants, proposer leur ventilation **avec confirmation humaine**. Une absence de marqueur « Import Vinted » ne doit plus être considérée comme rassurante.
- Chaque **nouvel** achat importé porte une provenance structurée `source=vinted_import`, un détail prix vendeur/livraison/protection et le lien vers une preuve d'achat lorsque celle-ci est jointe.
- Jamais recalculer automatiquement une vente déjà facturée ou une déclaration passée.
- Ajouter un marquage **historique non vérifié**, sur la base de la provenance détectable ; avertir qu'une absence de marqueur ne garantit pas absence de frais.
- Sur contrôle SQL en lecture seule du 17/10/2026, `purchases.comment ILIKE 'Import Vinted%'` : **0 enregistrement identifiable**, ce qui n'exclut pas les achats manuels ou imports historiques dépourvus du texte.
- Arbitrage d'une correction rétrospective des déclarations par le comptable du client, pas par l'application.

Dossier détaillé : **#11**.

## 8. Facturation client, Excel et dashboard

### PDF
- **Ne jamais** afficher la commission bancaire / livraison payée par le commerçant comme une ligne de frais client.
- Ajouter les seuls frais explicitement **facturés au client** en lignes distinctes ; intégrer dans le total facturé.
- Régime de TVA sur marge : ne **pas ventiler la TVA sur le document**, prévoir la mention du régime légal adéquate, **variable selon pays**. Le SPF Finances BE exige notamment la mention « Livraison soumise au régime particulier d'imposition de la marge bénéficiaire. TVA non déductible » ; la directive art. 226(14) prescrit « Régime particulier – Biens d'occasion ». Vérifier le texte à appliquer en France et Belgique.
- Franchise : ne pas afficher de TVA ; prévoir la mention nationale (« Régime particulier de franchise des petites entreprises » en BE, mentions FR à confirmer selon facturation en France).
- Une facture numérotée **ne doit pas être silencieusement régénérée avec un autre total**. Si correction : note de crédit / facture rectificative conforme aux exigences locales.

### Excel
- `Achats` et `Ventes` : colonnes agrégées (une seule fois par document) pour total d'articles, frais supportés, frais refacturés, TVA récupérable, TVA due éventuelle, marge économique.
- Onglet **« Détail frais »** : une ligne par frais, type, date, catégorie, description, notes, ventilation TVA et déclaration incluse/non incluse. Somme de colonne sans doublon entre une ligne principale et le détail.
- Séparer les tableaux de pilotage des rapports fiscaux ; éviter toute affirmation « déclaration TVA prête » si des montants restent non vérifiés.

### Dashboard
- Afficher **CA facturé**, **charges**, **marge économique**, **marge fiscale assujettie**, et, pour les sociétés franchisées, le **CA servant à apprécier le seuil** selon la réglementation locale. Le « seuil » ne doit pas être un simple `SUM(sales.total_ttc)` sans prise en compte des périodes et opérations exclues.

## 9. Ordre de livraison proposé

**Phase 0 — conformité fiscale et Vinted (bloquante)** : vérifier règles BE/FR avec professionnel, modèle de régime et changement de régime, calcul de TVA par article, provenance du coût Vinted, régression sur historiques.

**Phase 1 — saisie et conservation des frais** : migrations révisées, sécurité RLS/transaction, option Préférences, charges internes documentaires, refacturation client en brouillon, notes, justificatifs/provenance, édition/suppression.

**Phase 2 — calculs et exports** : prix fiscal vs prix économique, allocations (opt-in), marges commerciales et fiscales, Excel, rapports, intégration stock et retours/ventes partielles, scénarios mixtes.

**Phase 3 — factures et activation générale** : lignes client, mentions pays/régime, calcul total facture et TVA, immutabilité après numérotation, tests multi-appareils, activation derrière feature flag et monitoring.

**Gates de déploiement** : comptable BE/FR consulté ; migration testée sur base isolée ; ancien historique non modifié ; 0 doubles frais ; 0 mélange de frais internes dans PDF client ; autorisations RLS et atomicité prouvées ; tests TVA normale, franchise et marge, article par article, perte, multi-taux, Vinted.

## 10. Références officielles (à confirmer selon juridiction et date de prestation)

- [Directive TVA 2006/112/CE, art. 312, 315, 79 c et 226](https://eur-lex.europa.eu/eli/dir/2006/112/2025-04-14)
- [BOFiP 14/05/2025 : prix fiscal vs coût de revient, transport départ/franco, marge au coup par coup](https://bofip.impots.gouv.fr/bofip/13268-PGP.html/identifiant=BOI-TVA-SECT-90-20-20-20250514)
- [SPF Finances BE — Régime TVA sur marge](https://finances.belgium.be/fr/entreprises/tva/assujettissement-tva/regime-imposition-marge)
- [SPF Finances BE — Régime franchise des petites entreprises](https://finances.belgium.be/fr/entreprises/tva/assujettissement-tva/regime-franchise-taxe)
- [SPF Finances BE — Déclaration spéciale (services intracommunautaires)](https://finances.belgium.be/fr/entreprises/tva/declaration/declaration_speciale)
- [SPF Finances BE — Brochure franchise : mentions de facture](https://finances.belgium.be/sites/default/files/downloads/123-brochure-regime-franchise-de-taxe.pdf)

*Ce cadrage sert à concevoir et tester le logiciel. Il ne remplace pas une validation fiscale individuelle.*
