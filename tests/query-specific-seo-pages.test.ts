import { ok, equal } from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const pages = [
  {
    path: "src/routes/shopify-csv-import-not-working.tsx",
    route: "/shopify-csv-import-not-working",
    title: "Shopify CSV Import Not Working? Find the Row Blocking Upload | ProductCSVFixer",
    h1: "Shopify CSV import not working? Find the row blocking upload",
    phrase: "shopify csv import not working",
    cta: "Check my Shopify CSV free",
  },
  {
    path: "src/routes/shopify-inventory-policy-csv-error.tsx",
    route: "/shopify-inventory-policy-csv-error",
    title: "Shopify Inventory Policy CSV Error Checker | ProductCSVFixer",
    h1: "Fix Shopify inventory policy CSV errors before import",
    phrase: "inventory policy is not included in the list",
    cta: "Check inventory policy errors free",
  },
  {
    path: "src/routes/shopify-csv-required-columns.tsx",
    route: "/shopify-csv-required-columns",
    title: "Shopify CSV Required Columns Checker | ProductCSVFixer",
    h1: "Check Shopify CSV required columns before upload",
    phrase: "Shopify CSV required columns",
    cta: "Check required columns free",
  },
];

const sitemap = read("public/sitemap.xml");
const routeTree = read("src/routeTree.gen.ts");
const homepage = read("src/routes/index.tsx");

for (const page of pages) {
  ok(existsSync(page.path), `${page.path} should exist`);
  const source = read(page.path);

  ok(source.includes(`createFileRoute("${page.route}")`), `${page.route} route should exist`);
  ok(source.includes(page.title), `${page.route} should have query-specific SERP title`);
  ok(source.includes(page.h1), `${page.route} should have a query-specific H1`);
  ok(
    source.toLowerCase().includes(page.phrase.toLowerCase()),
    `${page.route} should use target query language`,
  );
  ok(source.includes(page.cta), `${page.route} should have a direct CSV-check CTA`);
  ok(source.includes('content: "index, follow"'), `${page.route} should be indexable`);
  ok(source.includes("application/ld+json"), `${page.route} should include structured data`);
  ok(source.includes('track("seo_page_viewed"'), `${page.route} should track SEO page views`);
  ok(
    source.includes('track("check_csv_cta_clicked"'),
    `${page.route} should track CSV check CTA clicks`,
  );
  equal(
    source.includes("Product Forge"),
    false,
    `${page.route} should not use internal Product Forge branding`,
  );

  ok(
    sitemap.includes(`<loc>https://productcsvfixer.com${page.route}</loc>`),
    `sitemap should include ${page.route}`,
  );
  ok(routeTree.includes(page.route), `route tree should include ${page.route}`);
  ok(homepage.includes(page.route), `homepage should internally link to ${page.route}`);
}

console.log("Query-specific SEO page assertions passed");
