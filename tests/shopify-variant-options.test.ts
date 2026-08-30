import assert from "node:assert/strict";

import {
  autoMapHeaders,
  defaultSettings,
  summarize,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const headers = [
  "Handle",
  "Title",
  "Variant SKU",
  "Variant Price",
  "Option1 Name",
  "Option1 Value",
];
const mappings = autoMapHeaders(headers);

const missingOptions = validateProducts(
  transformRows(
    [
      {
        Handle: "classic-tee",
        Title: "Classic Tee",
        "Variant SKU": "TEE-A",
        "Variant Price": "20.00",
        "Option1 Name": "",
        "Option1 Value": "",
      },
      {
        Handle: "classic-tee",
        Title: "",
        "Variant SKU": "TEE-B",
        "Variant Price": "20.00",
        "Option1 Name": "",
        "Option1 Value": "",
      },
    ],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);
assert.equal(
  summarize(missingOptions).blockedRows,
  2,
  "multiple variants without option values must be blocked",
);
assert.ok(
  missingOptions.every((product) =>
    product.validationErrors.some(
      (issue) => issue.field === "option1Value" && issue.severity === "error",
    ),
  ),
);

const duplicateOptions = validateProducts(
  transformRows(
    [
      {
        Handle: "classic-tee",
        Title: "Classic Tee",
        "Variant SKU": "TEE-A",
        "Variant Price": "20.00",
        "Option1 Name": "Color",
        "Option1 Value": "Blue",
      },
      {
        Handle: "classic-tee",
        Title: "",
        "Variant SKU": "TEE-B",
        "Variant Price": "20.00",
        "Option1 Name": "Color",
        "Option1 Value": "blue",
      },
    ],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);
assert.equal(
  summarize(duplicateOptions).blockedRows,
  2,
  "duplicate variant option combinations must be blocked",
);
assert.ok(
  duplicateOptions.every((product) =>
    product.validationErrors.some(
      (issue) => issue.message === "Duplicate variant option combination",
    ),
  ),
);

console.log("Shopify variant-option regression test passed");
