import { ok } from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const checklist = "public/shopify-csv-import-checklist.csv";
const template = "public/shopify-product-csv-starter-template.csv";
const importPage = "src/routes/shopify-csv-import-not-working.tsx";
const outreachPack = "docs/productcsvfixer-traffic-sprint-outreach.md";

ok(
  existsSync(checklist),
  "traffic sprint should include a downloadable Shopify CSV import checklist",
);
ok(
  existsSync(template),
  "traffic sprint should include a downloadable Shopify product CSV template",
);
ok(existsSync(outreachPack), "traffic sprint should include a community outreach answer pack");

const checklistSource = read(checklist);
const templateSource = read(template);
const importPageSource = read(importPage);
const outreachSource = read(outreachPack);

for (const expected of [
  "Check Area",
  "Why It Matters",
  "Title",
  "Handle",
  "Variant SKU",
  "Variant Price",
  "Image Src",
]) {
  ok(checklistSource.includes(expected), `checklist should mention ${expected}`);
}

for (const expected of ["Title", "Handle", "Variant SKU", "Variant Price", "Image Src"]) {
  ok(templateSource.includes(expected), `template should include ${expected}`);
}

ok(
  importPageSource.includes("/shopify-csv-import-checklist.csv"),
  "import-not-working page should link the checklist download",
);
ok(
  importPageSource.includes("/shopify-product-csv-starter-template.csv"),
  "import-not-working page should link the starter template download",
);
ok(
  importPageSource.includes("traffic_asset_downloaded") ||
    importPageSource.includes("shopify-csv-import-checklist"),
  "download assets should have trackable link context",
);
ok(
  outreachSource.includes("Shopify CSV import not working") &&
    outreachSource.includes("inventory policy is not included in the list") &&
    outreachSource.includes("duplicate SKU"),
  "outreach pack should cover the first community traffic themes",
);
ok(
  outreachSource.includes("Do not spam") && outreachSource.includes("self-serve"),
  "outreach pack should enforce non-spam, self-serve positioning",
);

console.log("Traffic sprint asset assertions passed");
