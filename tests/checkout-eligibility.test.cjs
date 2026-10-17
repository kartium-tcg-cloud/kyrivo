const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const src = fs.readFileSync(path.join(__dirname, "../src/lib/checkoutEligibility.ts"), "utf8");
const compiled = ts.transpileModule(src, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const harnessModule = { exports: {} };
vm.runInNewContext(compiled, { module: harnessModule, exports: harnessModule.exports, Date, Number });
const { blocksDuplicatePlanCheckout } = harnessModule.exports;
const now = new Date("2026-10-17T18:00:00Z");

function subscription(overrides = {}) {
  return {
    plan: "pro",
    status: "active",
    subscriptionEndsAt: "2026-11-17T18:00:00Z",
    stripeSubscriptionId: "sub_paid",
    ...overrides,
  };
}
test("forfait Pro en cours : interdit de racheter Pro mensuel ou trimestriel", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription(), "pro", now), true);
  // The API receives the plan but not the requested billing interval;
  // either interval of the same plan is intentionally blocked.
});
test("abonnement actif avec résiliation prévue : bloque un deuxième paiement Pro", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription({ status: "canceled" }), "pro", now), true);
});
test("paiement en retard : régulariser via portail, sans créer une seconde souscription", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription({ status: "past_due" }), "pro", now), true);
});
test("expiration réelle : le même plan peut être souscrit à nouveau", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription({ status: "canceled", subscriptionEndsAt: "2026-10-16T18:00:00Z" }), "pro", now), false);
});
test("essai gratuit : conversion vers Pro autorisée", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription({ plan: "trial", status: "trialing" }), "pro", now), false);
});
test("upgrade Pro vers Business permis et downgrade bloqué par garde existante", () => {
  assert.equal(blocksDuplicatePlanCheckout(subscription(), "business", now), false);
});
test("ne bloque pas un compte sans souscription ou sans date confirmée", () => {
  assert.equal(blocksDuplicatePlanCheckout(null, "pro", now), false);
  assert.equal(blocksDuplicatePlanCheckout(subscription({ subscriptionEndsAt: null }), "pro", now), false);
});
test("le checkout refuse réellement le même plan avant de créer une session Stripe", () => {
  const code = fs.readFileSync(path.join(__dirname, "../src/app/api/stripe/checkout/route.ts"), "utf8");
  const guard = code.indexOf("if (blocksDuplicatePlanCheckout(");
  const create = code.indexOf("stripe.checkout.sessions.create(");
  assert.ok(guard >= 0 && create > guard);
  assert.match(code.slice(guard, create), /status: 409/);
});
test("l'interface montre Abonnement actif et interdit le clic", () => {
  const code = fs.readFileSync(path.join(__dirname, "../src/app/abonnements/page.tsx"), "utf8");
  assert.match(code, /label:\s*checkoutSubscription\?\.status === "past_due"[\s\S]*?: "Abonnement actif",[\s\S]*?disabled: true/);
  assert.doesNotMatch(code, /Prolonger mon abonnement/);
});
