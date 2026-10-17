const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("le nouveau logo transparent est bien enregistré en PNG 256 x 256", () => {
  const png = fs.readFileSync(path.join(root, "public/brand/kyrivo-mark-2026.png"));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 256);
  assert.equal(png.readUInt32BE(20), 256);
  assert.ok(png.length > 1000);
});

test("les favicons et l’icône Apple ne montrent plus le K généré", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /kyrivo-mark-2026\.png/);
  assert.match(layout, /kyrivo-favicon\.svg/);
  for (const oldRoute of ["src/app/icon.tsx", "src/app/apple-icon.tsx", "src/app/favicon.ico"]) {
    assert.equal(fs.existsSync(path.join(root, oldRoute)), false, oldRoute);
  }
  const svg = read("public/brand/kyrivo-favicon.svg");
  assert.match(svg, /carte et flux/);
  assert.doesNotMatch(svg, /polygon points="5,3/);
});

test("le logo s’affiche dans le menu et les pages de connexion/inscription", () => {
  const sidebar = read("src/components/Sidebar.tsx");
  const logo = read("src/components/ui/BrandLogo.tsx");
  assert.match(sidebar, /kyrivo-mark-2026\.png/);
  assert.match(logo, /kyrivo-mark-2026\.png/);
  for (const p of ["src/app/login/page.tsx", "src/app/register/page.tsx"]) {
    assert.match(read(p), /<BrandLogo/);
    assert.doesNotMatch(read(p), /kyrivo-logo-primary-dark\.svg/);
  }
});
