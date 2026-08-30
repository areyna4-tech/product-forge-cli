import assert from "node:assert/strict";

import {
  autoMapHeaders,
  buildShopifyRows,
  defaultSettings,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const headers = [
  "Handle",
  "Title",
  "Variant SKU",
  "Variant Price",
  "Variant Inventory Policy",
  "Image Src",
];
const products = validateProducts(
  transformRows(
    [
      {
        Handle: "classic-tee",
        Title: "Classic Tee",
        "Variant SKU": "TEE-A",
        "Variant Price": "20.00",
        "Variant Inventory Policy": "deny",
        "Image Src": "https://cdn.example.com/tee.jpg",
      },
      {
        Handle: "classic-tee",
        Title: "",
        "Variant SKU": "",
        "Variant Price": "",
        "Variant Inventory Policy": "continue",
        "Image Src": "https://cdn.example.com/tee-green.jpg",
      },
    ],
    autoMapHeaders(headers),
    defaultSettings,
  ),
  defaultSettings,
);

assert.ok(
  products[1].validationErrors.some(
    (issue) => issue.field === "option1Value" && issue.severity === "error",
  ),
  "a continuation row with inventory data is a variant row, not an image-only row",
);
assert.equal(
  buildShopifyRows(products)[1]["Variant Inventory Policy"],
  "continue",
  "variant data must not be silently discarded by the image-only exporter",
);

console.log("Shopify image-only guard regression test passed");
