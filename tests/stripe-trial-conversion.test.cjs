/*
 * Tests isolés du webhook Checkout : la fin de l'essai ne doit jamais
 * prolonger une période payante Stripe, même en cas de redélivrance.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const START = Math.floor(Date.parse("2026-10-17T16:39:10Z") / 1000);
const MONTH_END = Math.floor(Date.parse("2026-11-17T16:39:10Z") / 1000);
const QUARTER_END = Math.floor(Date.parse("2027-01-17T16:39:10Z") / 1000);
const TRIAL_END = "2026-10-24T16:37:32.000Z";
const source = fs.readFileSync(
  path.join(__dirname, "../src/app/api/stripe/webhook/route.ts"), "utf8"
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

function createHarness({ period = "monthly", plan = "pro" } = {}) {
  const record = {
    company_id: "company-test",
    plan: "trial",
    status: "trialing",
    stripe_subscription_id: null,
    stripe_customer_id: null,
    trial_ends_at: TRIAL_END,
    current_period_start: "2026-10-17T16:37:32Z",
    current_period_end: TRIAL_END,
    subscription_ends_at: null,
  };
  const writes = [];
  const stripeSubscription = {
    id: "sub_paid",
    customer: "cus_test",
    status: "active",
    items: { data: [{
      current_period_start: START,
      current_period_end: period === "quarterly" ? QUARTER_END : MONTH_END,
    }] },
  };
  const supabaseAdmin = {
    from(table) {
      assert.equal(table, "subscriptions");
      return {
        select() {
          return {
            eq(column, value) {
              assert.equal(column, "company_id");
              assert.equal(value, record.company_id);
              return {
                async maybeSingle() { return { data: { ...record }, error: null }; },
              };
            },
          };
        },
        upsert(value) {
          Object.assign(record, value);
          writes.push(value);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  const stripe = {
    webhooks: { constructEvent: () => ({
      type: "checkout.session.completed",
      data: { object: {
        metadata: { companyId: "company-test", plan, billingPeriod: period },
        customer: "cus_test",
        subscription: "sub_paid",
      } },
    }) },
    subscriptions: {
      async retrieve(id) { assert.equal(id, "sub_paid"); return stripeSubscription; },
      async cancel() { throw new Error("Pas d'ancien abonnement à annuler"); },
    },
  };
  const requireMock = id => {
    if (id === "next/server") return {
      NextResponse: { json(body, options = {}) {
        return { status: options.status ?? 200, body };
      } },
    };
    if (id === "@/lib/stripe") return { stripe };
    if (id === "@/lib/supabase/admin") return { supabaseAdmin };
    if (id === "@/lib/openaiAdsServer") return { sendOpenAISubscriptionConversion: async () => {} };
    if (id === "@/lib/stripe-plans") return { getPlanFromPriceId: () => null };
    throw new Error("Module inattendu : " + id);
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: requireMock,
    console: { log() {}, warn() {}, error() {} },
    process: { env: { STRIPE_WEBHOOK_SECRET: "whsec_test" } },
    Date,
  });
  const deliver = () => module.exports.POST({
    text: async () => "test-webhook",
    headers: { get: key => key === "stripe-signature" ? "signature" : null },
  });
  return { record, writes, deliver };
}

test("essai + forfait mensuel : date de fin exactement égale à Stripe, sans 7 jours", async () => {
  const h = createHarness();
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.record.plan, "pro");
  assert.equal(h.record.status, "active");
  assert.equal(h.record.trial_ends_at, null);
  assert.equal(h.record.monthly_line_limit, 500);
  assert.equal(h.record.current_period_start, new Date(START * 1000).toISOString());
  assert.equal(h.record.current_period_end, new Date(MONTH_END * 1000).toISOString());
  assert.equal(h.record.subscription_ends_at, new Date(MONTH_END * 1000).toISOString());
  assert.equal(h.writes.length, 1);
});

test("même checkout livré deux fois : pas de deuxième mois", async () => {
  const h = createHarness();
  await h.deliver();
  await h.deliver();
  assert.equal(h.record.subscription_ends_at, new Date(MONTH_END * 1000).toISOString());
  assert.equal(h.writes.length, 1);
});

test("essai + offre trimestrielle : trois mois payés, quota réinitialisé après un mois", async () => {
  const h = createHarness({ period: "quarterly", plan: "business" });
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.record.trial_ends_at, null);
  assert.equal(h.record.monthly_line_limit, 5000);
  assert.equal(h.record.subscription_ends_at, new Date(QUARTER_END * 1000).toISOString());
  assert.equal(h.record.current_period_end, new Date(MONTH_END * 1000).toISOString());
});
