const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

test("le bandeau d'aide ne passe plus au-dessus des formulaires", () => {
  const layout = read("src/app/layout.tsx");
  const modal = read("src/components/ui/Modal.tsx");
  const stock = read("src/app/stock/page.tsx");
  assert.match(layout, /fixed top-0 left-0 right-0 z-30/);
  assert.match(modal, /fixed inset-0 z-50/);
  assert.match(stock, /fixed inset-0 z-50/);
  assert.doesNotMatch(layout, /z-\[60\]/);
});

test("Achats : cartes mobiles, tableau desktop, actions et documents préservés", () => {
  const src = read("src/components/achats/AchatsTableau.tsx");
  assert.match(src, /role="list" aria-label="Liste des achats"/);
  assert.match(src, /divide-y divide-neutral-800\/60 lg:hidden/);
  assert.match(src, /className="relative hidden lg:block"/);
  assert.match(src, /\{article\.nom\}/);
  assert.match(src, /onClick=\{\(\) => onModifier\(achat\)\}/);
  assert.match(src, /onClick=\{\(\) => onSupprimer\(achat\.id\)\}/);
  assert.match(src, /onManageFees\(achat\)/);
  assert.match(src, /getPurchaseDocumentSignedUrl\(achat\.documentUrl!\)/);
  assert.match(src, /onReviewFiscal\(achat\)/);
  assert.match(src, /min-h-11/g);
});

test("Stock : cartes jusqu'au format tablette et actions tactiles", () => {
  const src = read("src/app/stock/page.tsx");
  assert.match(src, /divide-y divide-neutral-800\/60 lg:hidden/);
  assert.match(src, /hidden overflow-x-auto lg:block/);
  assert.match(src, /min-h-11 flex-1 items-center justify-center/);
  assert.match(src, /window\.matchMedia\("\(hover: hover\) and \(pointer: fine\)"\)/);
  assert.match(src, /py-2 pl-9 pr-3 text-base sm:text-sm/);
  assert.match(src, /py-2\.5 text-base sm:text-sm/);
});

test("Formulaires : champs et actions lisibles avec le clavier iOS", () => {
  const achat = read("src/components/achats/AchatFormModal.tsx");
  const filters = read("src/components/achats/AchatsFiltres.tsx");
  const vinted = read("src/components/achats/VintedItemsEditModal.tsx");
  const modal = read("src/components/ui/Modal.tsx");
  assert.match(achat, /grid-cols-1 gap-3 sm:grid-cols-\[80px_minmax\(0,1fr\)\]/);
  assert.match(filters, /py-2\.5 text-base sm:text-sm/);
  assert.match(vinted, /min-h-11 flex-1 rounded-lg bg-amber-500/);
  assert.match(modal, /min-h-11 min-w-11/);
});
