import { ok, equal } from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

ok(existsSync("public/robots.txt"), "robots.txt should exist in public/");
ok(existsSync("public/sitemap.xml"), "sitemap.xml should exist in public/");

const robots = read("public/robots.txt");
ok(robots.includes("User-agent: *"), "robots.txt should allow all user agents");
ok(
  robots.includes("Sitemap: https://productcsvfixer.com/sitemap.xml"),
  "robots.txt should declare sitemap URL",
);

const sitemap = read("public/sitemap.xml");
for (const url of [
  "https://productcsvfixer.com/",
  "https://productcsvfixer.com/fix-shopify-product-csv",
  "https://productcsvfixer.com/shopify-csv-import-errors",
  "https://productcsvfixer.com/supplier-csv-to-shopify",
  "https://productcsvfixer.com/shopify-csv-validator",
]) {
  ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap should include ${url}`);
}

const root = read("src/routes/__root.tsx");
equal(root.includes("Lovable App"), false, "root fallback metadata should not say Lovable App");
ok(
  root.includes("ProductCSVFixer | Shopify CSV Import Error Checker"),
  "root fallback title should be ProductCSVFixer-specific",
);

const validator = read("src/routes/shopify-csv-validator.tsx");
ok(
  validator.includes('createFileRoute("/shopify-csv-validator")'),
  "Shopify CSV validator route should exist",
);
ok(
  validator.includes("Shopify CSV Validator"),
  "validator page should target Shopify CSV Validator search intent",
);
ok(
  validator.includes("application/ld+json"),
  "validator page should include JSON-LD structured data",
);

const routeTree = read("src/routeTree.gen.ts");
ok(
  routeTree.includes("/shopify-csv-validator"),
  "generated route tree should include Shopify CSV validator route",
);

const homepage = read("src/routes/index.tsx");
for (const href of [
  "/fix-shopify-product-csv",
  "/shopify-csv-import-errors",
  "/supplier-csv-to-shopify",
  "/shopify-csv-validator",
]) {
  ok(homepage.includes(href), `homepage should internally link to ${href}`);
}

console.log("Technical SEO baseline assertions passed");
