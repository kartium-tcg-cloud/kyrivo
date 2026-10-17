const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("les chiffres d'avis Vinted et Google sont centralisés à 38 et 8", () => {
  const source = read("src/lib/socialProof.ts");
  assert.match(source, /vinted:\s*38\b/);
  assert.match(source, /google:\s*8\b/);
});

test("les badges et le pied de page partagent les mêmes chiffres", () => {
  const badges = read("src/components/SocialProofBadges.tsx");
  const home = read("src/app/page.tsx");
  assert.match(badges, /SOCIAL_PROOF_REVIEW_COUNTS\.vinted/);
  assert.match(badges, /SOCIAL_PROOF_REVIEW_COUNTS\.google/);
  assert.match(home, /SOCIAL_PROOF_REVIEW_COUNTS\.vinted/);
  assert.match(home, /SOCIAL_PROOF_REVIEW_COUNTS\.google/);
  assert.doesNotMatch(badges + home, /24 avis Vinted|7 avis Google|Vinted \(24 avis\)|Google \(7 avis\)/);
});
