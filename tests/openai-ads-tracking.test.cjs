const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

test("OpenAI Pixel consent before initialization and environment guard", () => {
  const pixel = read("src/components/OpenAIAdsPixel.tsx");
  const config = read("src/lib/openaiAdsConfig.ts");
  assert.match(config, /Xz1uJN6tAvvzkgpenWANvG/);
  assert.match(pixel, /KYRIVO_OPENAI_ADS_PIXEL_ID/);
  assert.match(pixel, /onReady=\{\(\) => trackPage\(window.location.pathname\)\}/);
  assert.match(pixel, /MARKETING_PAGES/);
  assert.match(pixel, /page_viewed/);
  assert.match(pixel, /lastTrackedPath.current === path/);
  const tracker = read("src/lib/openaiAds.ts");
  assert.match(tracker, /opt_out: true/);
  assert.match(pixel, /hasMarketingConsent/);
  assert.match(pixel, /oaiq\("consent",true\);oaiq\("init"/);
  assert.match(pixel, /bzrcdn.openai.com/);
  assert.match(read("src/app/layout.tsx"), /<OpenAIAdsPixel/);
});

test("UTM and opaque oppref preserved with marketing consent only", () => {
  const analytics = read("src/lib/analytics.ts");
  assert.match(analytics, /sessionStorage.setItem\("kyrivo_ads_oppref"/);
  assert.match(analytics, /!hasMarketingConsent\(\)/);
  assert.match(analytics, /getSignupAttribution/);
  assert.match(analytics, /utms.oppref = oppref/);
  const registration = read("src/app/register/page.tsx");
  assert.match(registration, /kyrivo_campaign_attribution: getSignupAttribution\(\)/);
  assert.match(registration, /trackOpenAIAds\("registration_completed"/);
  assert.match(registration, /trackOpenAIAds\("trial_started"/);
});

test("CAPI only after successful Stripe upsert and before response, isolated failures", () => {
  const webhook = read("src/app/api/stripe/webhook/route.ts");
  const start = webhook.indexOf("if (upsertError)");
  const conversion = webhook.indexOf("await sendOpenAISubscriptionConversion");
  assert.ok(start >= 0 && conversion > start);
  assert.match(webhook, /if \(isTrialConversion \|\| !existingSubscription\)/);
  const capi = read("src/lib/openaiAdsServer.ts");
  assert.match(capi, /OPENAI_ADS_CONVERSIONS_API_KEY/);
  assert.match(capi, /attribution.marketing_consent !== true/);
  assert.match(capi, /subscription_created/);
  assert.match(capi, /validate_only: false/);
  assert.match(capi, /AbortSignal.timeout/);
  assert.doesNotMatch(capi, /emails_sha256/);
});

test("private report restricted to internal owner and no data mutations", () => {
  const report = read("src/app/admin/marketing/page.tsx");
  assert.match(report, /user.id !== internalCompany.created_by/);
  assert.match(report, /notFound\(\)/);
  assert.match(report, /robots: \{ index: false/);
  assert.doesNotMatch(report, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
  assert.match(report, /AdBudgetCalculator/);
});

test("privacy and easy consent withdrawal present", () => {
  const legal = read("src/app/cookies/page.tsx");
  const privacy = read("src/app/politique-confidentialite/page.tsx");
  const settings = read("src/components/MarketingConsentSettings.tsx");
  assert.match(legal, /ChatGPT Ads/);
  assert.match(legal, /MarketingConsentSettings/);
  assert.match(privacy, /oppref/);
  assert.match(settings, /marketing_consent: value/);
  assert.match(settings, /kyrivo_ads_oppref/);
});
