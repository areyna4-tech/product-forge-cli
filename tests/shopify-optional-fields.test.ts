import assert from "node:assert/strict";

import {
  autoMapHeaders,
  defaultSettings,
  REQUIRED_FIELDS,
  summarize,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const mappings = autoMapHeaders(["Title", "Variant SKU", "Variant Price"]);
assert.deepEqual(
  REQUIRED_FIELDS,
  ["title"],
  "only Title is universally required for a new Shopify product CSV",
);

const [product] = validateProducts(
  transformRows(
    [{ Title: "SKU-optional product", "Variant SKU": "", "Variant Price": "" }],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);

assert.equal(
  product.validationErrors.some((issue) => issue.field === "sku" && issue.severity === "error"),
  false,
  "Shopify does not require a SKU unless a custom fulfillment service is used",
);
assert.equal(
  product.validationErrors.some((issue) => issue.field === "price" && issue.severity === "error"),
  false,
  "Shopify defaults a blank price to 0.00 rather than rejecting the import",
);
assert.equal(
  summarize([product]).exportableRows,
  1,
  "optional blank SKU and price must remain exportable",
);

const [customFulfillmentWithoutSku] = validateProducts(
  transformRows(
    [
      {
        Title: "Custom fulfilled product",
        SKU: "",
        Price: "10",
        "Fulfillment service": "warehouse-partner",
      },
    ],
    autoMapHeaders(["Title", "SKU", "Price", "Fulfillment service"]),
    defaultSettings,
  ),
  defaultSettings,
);
assert.ok(
  customFulfillmentWithoutSku.validationErrors.some(
    (issue) => issue.field === "sku" && issue.severity === "error",
  ),
  "custom fulfillment requires a SKU even though standard/manual fulfillment does not",
);

console.log("Shopify optional SKU and price regression test passed");
