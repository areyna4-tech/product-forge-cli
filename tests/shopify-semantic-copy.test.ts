import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const productCopy = [
  "src/routes/index.tsx",
  "src/routes/__root.tsx",
  "src/routes/shopify-csv-required-columns.tsx",
  "src/routes/shopify-inventory-policy-csv-error.tsx",
  "src/routes/shopify-csv-import-not-working.tsx",
  "src/routes/shopify-csv-import-errors.tsx",
  "src/routes/shopify-csv-validator.tsx",
  "src/routes/supplier-csv-to-shopify.tsx",
]
  .map(read)
  .join("\n");

assert.equal(
  /missing SKUs/i.test(productCopy),
  false,
  "ordinary blank SKUs must not be described as universally missing or blocking",
);
assert.equal(
  /duplicate handles/i.test(productCopy),
  false,
  "repeated Shopify handles must not be described as duplicate errors",
);
assert.equal(
  /missing titles, handles, SKUs, prices|missing titles, SKUs, prices, handles/i.test(productCopy),
  false,
  "ordinary blank SKUs and prices must not be grouped with universal required-field failures",
);
assert.equal(
  /handle, price, and SKU[^.]*\.\s*Missing values are flagged as errors/i.test(productCopy),
  false,
  "blank SKU and price values must not be described as errors",
);
assert.equal(
  /missing product titles, handles, prices/i.test(productCopy),
  false,
  "blank prices must not be presented as missing required fields",
);
assert.ok(
  productCopy.includes("Blank SKU warnings and conditional SKU requirements"),
  "the homepage should distinguish blank-SKU warnings from conditional requirements",
);
assert.ok(
  productCopy.includes("Blank prices receive a warning; malformed prices are blocked"),
  "the homepage should distinguish blank prices from malformed prices",
);
assert.ok(
  productCopy.includes("Product-group and variant-row issues"),
  "the homepage should describe group-aware validation rather than duplicate handles",
);

console.log("Shopify semantic copy regression test passed");
