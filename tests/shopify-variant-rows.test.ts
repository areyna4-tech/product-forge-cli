import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";

import {
  autoMapHeaders,
  buildShopifyRows,
  defaultSettings,
  summarize,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const csv = readFileSync("tests/fixtures/shopify-variant-and-image-rows.csv", "utf8");
const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
const products = validateProducts(
  transformRows(parsed.data, autoMapHeaders(parsed.meta.fields ?? []), defaultSettings),
  defaultSettings,
);

assert.equal(
  summarize(products).blockedRows,
  0,
  "valid Shopify variant and image-only continuation rows must not be blocked for blank product-level fields",
);
assert.equal(
  products[1].validationErrors.some((issue) => issue.field === "title"),
  false,
  "a later variant sharing the product handle must not require a repeated title",
);
assert.deepEqual(
  products[2].validationErrors,
  [],
  "an image-only continuation row must not be treated as a product variant",
);

const exported = buildShopifyRows(products);
assert.equal(
  exported[1]["Title"],
  "",
  "variant continuation rows must keep product-level title blank",
);
assert.equal(exported[0]["Option1 Name"], "Color");
assert.equal(exported[0]["Option1 Value"], "Blue");
assert.equal(exported[1]["Option1 Name"], "Color");
assert.equal(exported[1]["Option1 Value"], "Red");
assert.notEqual(
  exported[0]["Option1 Value"],
  exported[1]["Option1 Value"],
  "variant rows must export unique option combinations",
);
assert.equal(
  exported[2]["Variant SKU"],
  "",
  "image-only rows must not gain a synthetic variant SKU",
);
assert.equal(exported[2]["Variant Price"], "", "image-only rows must not gain a synthetic price");
assert.equal(
  exported[2]["Variant Inventory Policy"],
  "",
  "image-only rows must not gain a synthetic inventory policy",
);

const blockedGroupRows = [
  {
    Handle: "blocked-product",
    Title: "Blocked product",
    SKU: "BLOCKED-BLUE",
    Price: "1,2,3",
    "Option1 Name": "Color",
    "Option1 Value": "Blue",
  },
  {
    Handle: "blocked-product",
    Title: "",
    SKU: "BLOCKED-RED",
    Price: "20",
    "Option1 Name": "Color",
    "Option1 Value": "Red",
  },
  {
    Handle: "blocked-product",
    Title: "",
    SKU: "",
    Price: "",
    "Image Src": "https://cdn.example.com/blocked-product.jpg",
  },
];
const blockedGroup = validateProducts(
  transformRows(
    blockedGroupRows,
    autoMapHeaders(Object.keys(blockedGroupRows[0])),
    defaultSettings,
  ),
  defaultSettings,
);
assert.ok(
  blockedGroup[0].validationErrors.some((issue) => issue.severity === "error"),
  "the titled parent row must be blocked by its malformed price",
);
assert.ok(
  blockedGroup[1].validationErrors.some(
    (issue) => issue.severity === "error" && issue.message === "Parent product row is blocked",
  ),
  "a variant continuation must be blocked when its parent product row is blocked",
);
assert.ok(
  blockedGroup[2].validationErrors.some(
    (issue) => issue.severity === "error" && issue.message === "Parent product row is blocked",
  ),
  "an image continuation must be blocked when its parent product row is blocked",
);
assert.equal(
  blockedGroup.filter(
    (product) => !product.validationErrors.some((issue) => issue.severity === "error"),
  ).length,
  0,
  "blocked product groups must not emit orphan continuation rows",
);

console.log("Shopify variant and image-row regression test passed");
