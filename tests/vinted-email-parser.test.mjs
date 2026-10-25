import test from "node:test";
import assert from "node:assert/strict";
import { parseVintedEmails } from "../src/lib/vintedEmailParser.ts";

const one = String.raw`
Bonjour kartium-tcg,
Ton paiement a été reçu.
Reçu pour ta commande Vinted :
| **Vendeur** | louislgr92 |
| **Commande** | |
Miaouss EX 062/088 – Équilibre Parfait
| **Montant payé** | 4,97 € |
| Article | 1,00 € |
| Frais de port | 3,35 € |
| Frais Vinted | 0,62 € |
| **Mode de paiement** | Bancontact Pay (4,97 €) |
| **Date du paiement** | 07/10/2026 08 h 46 |
| **N° de transaction** | 22944027770 |
`;
const second = String.raw`
Bonjour kartium-tcg,
Votre paiement a été reçu.
Reçu pour votre commande Vinted :
| **Vendeur** | clement2451 |
| **Commande** | |
Razer Kiyo Broadcasting Camera
| **Montant payé** | 35,17 € |
| Article | 30,00 € |
| Frais de port | 3,35 € |
| Frais Vinted | 1,82 € |
| **Mode de paiement** | Porte-monnaie Vinted (14,91 €) Bancontact Pay (20,26 €) |
| **Date du paiement** | 07/10/2026 04 h 33 |
| **N° de transaction** | 22941299067 |
`;
const bundle = String.raw`
Bonjour kartium-tcg,
Votre paiement a été reçu.
Reçu pour votre commande Vinted :
| **Vendeur** | linhio88 |
| **Commande** | |
Lanssorien ex
Cendre sacrée 115/88
Mega lockpin ex 84/94
Mega Lucario ex 113/217
Lanssorien ex 130/167
Zoroark ex 98/159
Zoroark ex 98/159
| **Montant payé** | 10,34 € |
| Article | 6,50 € |
| Frais de port | 2,99 € |
| Frais de Protection acheteurs | 0,85 € |
| **Mode de paiement** | le porte-monnaie Vinted (10,34 €) |
| **Date du paiement** | 05/10/2026 07 h 05 |
| **N° de transaction** | 22877445166 |
`;
const sale = String.raw`
Ton article s'est vendu !
Bonjour kartium-tcg,
kennygaland a acheté
| [Display Disney Lorcana Chapitre 11 Givresort – 24 Boosters – FR – Scellée](https://images.vinted.net/t/image.jpeg) | **Display Disney Lorcana Chapitre 11 Givresort – 24 Boosters – FR – Scellée** | **105,00 €** |
Nous transférerons le paiement sur ton porte-monnaie Vinted une fois la commande terminée.
Rends-toi dans le [fil de conversation](https://www.vinted.be/inbox/25515836160) entre l'acheteur et toi.
| Adresse e-mail : | kennygaland@hotmail.com |
`;
const lotSale = String.raw`
Bonjour kartium-tcg,
thibaut.u a acheté
| [Lot 2 articles](https://images.vinted.net/a.jpeg) | 2 | **Lot 2 articles** | **85,00 €** |
Nous transférerons le paiement sur ton porte-monnaie Vinted une fois la commande terminée.
`;
test("Vinted: reçu Miaouss, tarif réel et référence détectés", () => {
  const [p] = parseVintedEmails(one);
  assert.equal(p.kind, "purchase");
  assert.equal(p.key, "purchase:22944027770");
  assert.equal(p.title, "Miaouss EX 062/088 – Équilibre Parfait");
  assert.equal(p.counterparty, "louislgr92");
  assert.equal(p.date, "2026-10-07");
  assert.equal(p.sellerPrice, 1);
  assert.equal(p.shippingFee, 3.35);
  assert.equal(p.vintedFee, 0.62);
  assert.equal(p.paidTotal, 4.97);
  assert.equal(p.status, "ready");
});
test("Vinted: paiement mixte ne modifie pas le total", () => {
  const [p] = parseVintedEmails(second);
  assert.equal(p.paidTotal, 35.17);
  assert.equal(p.paymentDescription.includes("14,91"), true);
  assert.equal(p.paymentDescription.includes("20,26"), true);
  assert.equal(p.vintedFee, 1.82);
});
test("Vinted: lot acheté avec sept articles et répétition", () => {
  const [p] = parseVintedEmails(bundle);
  assert.equal(p.items.length, 7);
  assert.equal(p.items.filter(x => x === "Zoroark ex 98/159").length, 2);
  assert.equal(p.sellerPrice, 6.50);
  assert.equal(p.vintedFee, 0.85);
  assert.equal(p.paidTotal, 10.34);
});
test("Vinted: annonce de vente, sans lui inventer un paiement final ni une date", () => {
  const [s] = parseVintedEmails(sale);
  assert.equal(s.kind, "sale");
  assert.match(s.title, /Disney Lorcana Chapitre 11/);
  assert.equal(s.counterparty, "kennygaland");
  assert.equal(s.sellerPrice, 105);
  assert.equal(s.date, null);
  assert.equal(s.status, "review");
  assert.equal(JSON.stringify(s).includes("kennygaland@hotmail.com"), false);
});
test("Vinted: lot vendu et doublons d'import", () => {
  const [s] = parseVintedEmails(lotSale);
  assert.equal(s.sellerPrice, 85);
  assert.match(s.warnings.join(" "), /Lot/);
  const merged = parseVintedEmails(one + "\n---\n" + one + "\n---\n" + lotSale);
  assert.equal(merged.length, 2);
});
test("Vinted: texte non reconnu ignoré", () => {
  assert.deepEqual(parseVintedEmails("Newsletter du mois sans transaction"), []);
});
