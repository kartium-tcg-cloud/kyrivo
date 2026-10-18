/*
 * Tests hors ligne du webhook de Kyrivo.
 * Aucune variable de .env.local n'est chargée ; aucun appel réseau n'est effectué.
 * Exécution : node --test tests/stripe-reactivation.test.cjs
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const webhookFile = path.join(
  __dirname,
  "../src/app/api/stripe/webhook/route.ts"
);
const compiled = ts.transpileModule(fs.readFileSync(webhookFile, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const START = Math.floor(Date.parse("2026-10-15T00:29:03.000Z") / 1000);
const END = Math.floor(Date.parse("2026-11-15T00:29:03.000Z") / 1000);

function mockSubscriptionRow(overrides = {}) {
  return {
    company_id: "test-company",
    stripe_subscription_id: "sub_test",
    stripe_customer_id: "cus_test",
    plan: "pro",
    status: "expired",
    monthly_line_limit: 0,
    billing_period: "monthly",
    subscription_ends_at: null,
    ...overrides,
  };
}

function createHarness(event, row = mockSubscriptionRow(), options = {}) {
  const writes = [], stripeUpdates = [];
  const module = { exports: {} };
  let currentEvent = event;
  const nowSec = options.nowSec ?? Math.floor(Date.parse("2026-10-15T04:00:00Z")/1000);
  const FixedDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [nowSec*1000])); }
    static now() { return nowSec*1000; }
  };
  const source = event.type === "customer.subscription.updated" ? event.data.object : null;
  const liveSubscription = options.liveSubscription ?? {
    id: "sub_test", customer: "cus_test", status: source?.status ?? "active",
    billing_mode: { type: "flexible" }, cancel_at_period_end: false, metadata: {},
    items: { data: [{ price: { id: "price_pro" }, current_period_start: START, current_period_end: END }] },
    ...(source ?? {}),
  };

  const supabaseAdmin = {
    from(table) {
      assert.equal(table, "subscriptions");
      return {
        select() {
          return {
            eq(column, value) {
              return {
                async maybeSingle() {
                  if (row[column] === value) {
                    return {
                      data: {
                        company_id: row.company_id,
                        stripe_subscription_id: row.stripe_subscription_id,
                        status: row.status,
                        plan: row.plan,
                        billing_period: row.billing_period,
                        subscription_ends_at: row.subscription_ends_at,
                      },
                      error: null,
                    };
                  }
                  return { data: null, error: null };
                },
              };
            },
          };
        },
        update(values) {
          return {
            async eq(column, value) {
              assert.equal(column, "company_id");
              assert.equal(value, row.company_id);
              Object.assign(row, values);
              writes.push(values);
              return { error: null };
            },
          };
        },
      };
    },
  };
  const stripe = {
    webhooks: { constructEvent: () => currentEvent },
    invoices: {
      retrieve: async () => ({ status: options.liveInvoiceStatus ?? "paid" }),
      listLineItems: async () => { throw new Error("Unexpected invoice line lookup"); },
    },
    subscriptions: {
      retrieve: async () => liveSubscription,
      update: async (id, args, reqOptions) => {
        assert.equal(id, "sub_test");
        assert.equal(args.billing_cycle_anchor, "now");
        assert.equal(args.proration_behavior, "none");
        assert.ok(reqOptions.idempotencyKey.includes(args.metadata.kyrivo_late_invoice_id));
        stripeUpdates.push(args);
        const start = new Date(nowSec*1000), end = new Date(nowSec*1000);
        end.setUTCMonth(end.getUTCMonth()+(options.intervalMonths ?? 1));
        liveSubscription.metadata = { ...liveSubscription.metadata, ...args.metadata };
        liveSubscription.items.data[0].current_period_start = nowSec;
        liveSubscription.items.data[0].current_period_end = Math.floor(end.getTime()/1000);
        return liveSubscription;
      },
    },
  };
  const mockRequire = (name) => {
    if (name === "next/server") {
      return {
        NextResponse: {
          json(body, options = {}) {
            return { status: options.status ?? 200, body };
          },
        },
      };
    }
    if (name === "@/lib/stripe") return { stripe };
    if (name === "@/lib/supabase/admin") return { supabaseAdmin };
    if (name === "@/lib/openaiAdsServer") return { sendOpenAISubscriptionConversion: async () => {} };
    if (name === "@/lib/stripe-plans") {
      return {
        getPlanFromPriceId: (id) =>
          ({ price_pro: "pro", price_business: "business", price_entreprise: "entreprise" })[id] ?? null,
      };
    }
    throw new Error("Unexpected import: " + name);
  };

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: mockRequire,
    process: { env: { STRIPE_WEBHOOK_SECRET: "whsec_unit_test_only" } },
    console: { log() {}, warn() {}, error() {} },
    Date: FixedDate,
  }, { filename: "route.ts" });

  async function deliver(nextEvent) {
    if (nextEvent) currentEvent = nextEvent;
    return module.exports.POST({
      text: async () => "mock-body",
      headers: { get: (name) => name === "stripe-signature" ? "mock-signature" : null },
    });
  }
  return { row, writes, deliver, stripeUpdates, liveSubscription };
}

function paidRenewal(priceId = "price_pro", options = {}) {
  return {
    type: "invoice.paid",
    data: {
      object: {
        id: options.invoiceId ?? "in_test",
        billing_reason: "subscription_cycle",
        status_transitions: { paid_at: options.paidAt ?? START+20 },
        customer: "cus_test",
        parent: { subscription_details: { subscription: "sub_test" } },
        lines: {
          has_more: false,
          data: [{
            parent: {
              type: "subscription_item_details",
              subscription_item_details: { proration: false },
            },
            pricing: { price_details: { price: priceId } },
            period: { start: options.start ?? START, end: options.end ?? END },
          }],
        },
      },
    },
  };
}

function updatedSubscription(status, priceId = "price_pro") {
  return {
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_test",
        customer: "cus_test",
        status,
        cancel_at_period_end: false,
        items: {
          data: [{
            price: { id: priceId },
            current_period_start: START,
            current_period_end: END,
          }],
        },
      },
    },
  };
}

test("invoice.paid réactive un compte expiré et restaure les 500 lignes Pro", async () => {
  const h = createHarness(paidRenewal());
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.row.status, "active");
  assert.equal(h.row.monthly_line_limit, 500);
  assert.equal(h.row.current_period_start, new Date(START * 1000).toISOString());
  assert.equal(h.row.current_period_end, new Date(END * 1000).toISOString());
  assert.equal(h.writes.length, 1);
});

test("customer.subscription.updated restaure 50 000 lignes Entreprise", async () => {
  const h = createHarness(
    updatedSubscription("active", "price_entreprise"),
    mockSubscriptionRow({ plan: "entreprise" })
  );
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.row.status, "active");
  assert.equal(h.row.monthly_line_limit, 50000);
  assert.equal(h.row.subscription_ends_at, new Date(END * 1000).toISOString());
});

test("un abonnement past_due n'obtient pas de nouveau quota", async () => {
  const h = createHarness(updatedSubscription("past_due"));
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.row.status, "past_due");
  assert.equal(h.row.monthly_line_limit, 0);
});

test("un tarif sans correspondance reprend le plan Business déjà connu", async () => {
  const h = createHarness(
    paidRenewal("price_unknown"),
    mockSubscriptionRow({ plan: "business" })
  );
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.row.monthly_line_limit, 5000);
  assert.equal(h.row.status, "active");
});

test("un plan non payant ou inconnu échoue sans activer le compte", async () => {
  const h = createHarness(
    paidRenewal("price_unknown"),
    mockSubscriptionRow({ plan: "trial" })
  );
  const result = await h.deliver();
  assert.equal(result.status, 500);
  assert.equal(h.row.status, "expired");
  assert.equal(h.row.monthly_line_limit, 0);
  assert.equal(h.writes.length, 0);
});

test("invoice.paid ne réactive pas une subscription annulée", async () => {
  const h = createHarness(
    paidRenewal(),
    mockSubscriptionRow({ status: "canceled" })
  );
  const result = await h.deliver();
  assert.equal(result.status, 200);
  assert.equal(h.row.status, "canceled");
  assert.equal(h.writes.length, 0);
});

function overdueFixture({ months = 1, mode = "flexible", cancel = false } = {}) {
  const start = Math.floor(Date.parse("2026-10-12T00:29:03Z") / 1000);
  const end = Math.floor(Date.parse(months === 3 ? "2027-01-12T00:29:03Z" : "2026-11-12T00:29:03Z") / 1000);
  const paidAt = Math.floor(Date.parse("2026-10-15T02:00:00Z") / 1000);
  const h = createHarness(
    paidRenewal("price_pro", { start, end, paidAt }),
    mockSubscriptionRow({ status: "past_due", billing_period: months === 3 ? "quarterly" : "monthly", subscription_ends_at: new Date(end*1000).toISOString() }),
    {
      intervalMonths: months,
      liveSubscription: {
        id: "sub_test", customer: "cus_test", status: "active",
        billing_mode: { type: mode }, cancel_at_period_end: cancel,
        metadata: {},
        items: { data: [{ price: { id: "price_pro" }, current_period_start: start, current_period_end: end }] },
      },
    }
  );
  return { h, start, end };
}

test("paiement à l'heure : ne touche pas à l'ancre de Stripe", async () => {
  const h = createHarness(paidRenewal());
  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 0);
});

test("paiement le 15 après échéance du 12 : nouvelle fin le 15 novembre, sans 2e facture", async () => {
  const { h, start, end } = overdueFixture();
  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 1);
  assert.equal(h.stripeUpdates[0].proration_behavior, "none");
  assert.equal(h.row.status, "active");
  assert.equal(h.row.current_period_start, "2026-10-15T04:00:00.000Z");
  assert.equal(h.row.current_period_end, "2026-11-15T04:00:00.000Z");
  assert.equal(h.row.subscription_ends_at, "2026-11-15T04:00:00.000Z");

  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 1, "réémission du webhook : pas de second décalage");

  const stale = updatedSubscription("past_due");
  stale.data.object.items.data[0].current_period_start = start;
  stale.data.object.items.data[0].current_period_end = end;
  assert.equal((await h.deliver(stale)).status, 200);
  assert.equal(h.row.status, "active", "ancien statut ignoré");
  assert.equal(h.row.subscription_ends_at, "2026-11-15T04:00:00.000Z");

  const oldFailure = { type: "invoice.payment_failed", data: { object: {
    id: "in_test", parent: { subscription_details: { subscription: "sub_test" } },
  } } };
  assert.equal((await h.deliver(oldFailure)).status, 200);
  assert.equal(h.row.status, "active", "échec déjà régularisé ignoré");
});

test("forfait trois mois : l'échéance se décale, le quota reste mensuel", async () => {
  const { h } = overdueFixture({ months: 3 });
  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 1);
  assert.equal(h.row.subscription_ends_at, "2027-01-15T04:00:00.000Z");
  assert.equal(h.row.current_period_end, "2026-11-15T04:00:00.000Z");
});

test("forfait trois mois sans retard : le quota s'arrête après le premier mois", async () => {
  const start = Math.floor(Date.parse("2026-10-12T00:29:03Z")/1000);
  const end = Math.floor(Date.parse("2027-01-12T00:29:03Z")/1000);
  const h = createHarness(paidRenewal("price_pro",{start,end,paidAt:start+20}),
    mockSubscriptionRow({ billing_period:"quarterly",status:"past_due" }));
  assert.equal((await h.deliver()).status,200);
  assert.equal(h.row.current_period_end,"2026-11-12T00:29:03.000Z");
  assert.equal(h.row.subscription_ends_at,"2027-01-12T00:29:03.000Z");
  assert.equal(h.stripeUpdates.length,0);
});

test("mode Stripe classic : refuse le décalage susceptible de refacturer", async () => {
  const { h, end } = overdueFixture({ mode: "classic" });
  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 0);
  assert.equal(h.row.subscription_ends_at, new Date(end*1000).toISOString());
});

test("résiliation déjà planifiée : ne change pas son échéance", async () => {
  const { h } = overdueFixture({ cancel: true });
  assert.equal((await h.deliver()).status, 200);
  assert.equal(h.stripeUpdates.length, 0);
});

test("ancien événement d'échec reçu après régularisation : pas de nouvelle suspension", async () => {
  const event = { type: "invoice.payment_failed", data: { object: {
    id: "in_old", parent: { subscription_details: { subscription: "sub_test" } },
  } } };
  const h = createHarness(event, mockSubscriptionRow({ status:"active" }));
  assert.equal((await h.deliver()).status,200);
  assert.equal(h.row.status,"active");
  assert.equal(h.writes.length,0);
});
