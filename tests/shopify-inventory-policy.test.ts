import assert from "node:assert/strict";

import {
  autoMapHeaders,
  buildShopifyRows,
  defaultSettings,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const currentHeaders = [
  "URL handle",
  "Title",
  "SKU",
  "Price",
  "Continue selling when out of stock",
];
const mappings = autoMapHeaders(currentHeaders);

assert.equal(
  mappings.some(
    (mapping) => mapping.destinationField === "handle" && mapping.sourceColumn === "URL handle",
  ),
  true,
  "Shopify's current URL handle header must map to handle",
);
assert.equal(
  mappings.some(
    (mapping) =>
      mapping.destinationField === "inventoryPolicy" &&
      mapping.sourceColumn === "Continue selling when out of stock",
  ),
  true,
  "Shopify's current continue-selling header must map to inventory policy",
);

const [valid, invalid] = validateProducts(
  transformRows(
    [
      {
        "URL handle": "blue-mug",
        Title: "Blue Mug",
        SKU: "MUG-1",
        Price: "14.99",
        "Continue selling when out of stock": "continue",
      },
      {
        "URL handle": "red-mug",
        Title: "Red Mug",
        SKU: "MUG-2",
        Price: "14.99",
        "Continue selling when out of stock": "keep-selling",
      },
    ],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);

assert.equal(
  valid.validationErrors.some((issue) => issue.field === "inventoryPolicy"),
  false,
  "continue is a valid Shopify inventory policy",
);
assert.equal(
  buildShopifyRows([valid])[0]["Variant Inventory Policy"],
  "continue",
  "a valid continue policy must survive export rather than being overwritten with deny",
);
assert.equal(
  invalid.validationErrors.some(
    (issue) => issue.field === "inventoryPolicy" && issue.severity === "error",
  ),
  true,
  "unsupported inventory policy values must be import blockers",
);

const [mixedCase] = validateProducts(
  transformRows(
    [
      {
        "URL handle": "hat",
        Title: "Hat",
        SKU: "HAT-1",
        Price: "10.00",
        "Continue selling when out of stock": " CONTINUE ",
      },
    ],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);
assert.equal(
  mixedCase.validationErrors.some((issue) => issue.field === "inventoryPolicy"),
  false,
);
assert.equal(
  buildShopifyRows([mixedCase])[0]["Variant Inventory Policy"],
  "continue",
  "accepted inventory-policy values must export in Shopify's canonical lowercase form",
);

console.log("Shopify inventory-policy regression test passed");
