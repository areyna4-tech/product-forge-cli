import assert from "node:assert/strict";
import {
  autoMapHeaders,
  defaultSettings,
  summarize,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

const shopifyHeaders = [
  "Title",
  "Variant SKU",
  "Variant Price",
  "Image Src",
  "Variant Inventory Qty",
  "Handle",
  "Cost per item",
  "Variant Barcode",
];

const mappings = autoMapHeaders(shopifyHeaders);

assert.equal(
  mappings.some(
    (mapping) => mapping.destinationField === "title" && mapping.sourceColumn === "Title",
  ),
  true,
  "Title should map to title",
);
assert.equal(
  mappings.some(
    (mapping) => mapping.destinationField === "sku" && mapping.sourceColumn === "Variant SKU",
  ),
  true,
  "Variant SKU should map to sku",
);
assert.equal(
  mappings.some(
    (mapping) => mapping.destinationField === "price" && mapping.sourceColumn === "Variant Price",
  ),
  true,
  "Variant Price should map to price",
);
assert.equal(
  mappings.some(
    (mapping) => mapping.destinationField === "imageUrl" && mapping.sourceColumn === "Image Src",
  ),
  true,
  "Image Src should map to imageUrl",
);

const products = validateProducts(
  transformRows(
    [
      {
        Title: "Good Product",
        "Variant SKU": "SKU-1",
        "Variant Price": "19.99",
        "Image Src": "https://example.com/image.jpg",
        "Variant Inventory Qty": "10",
        Handle: "good-product",
        "Cost per item": "8.00",
        "Variant Barcode": "123456789012",
      },
    ],
    mappings,
    defaultSettings,
  ),
  defaultSettings,
);

const summary = summarize(products);
assert.equal(summary.exportableRows, 1, "valid Shopify-native CSV row should be exportable");
assert.deepEqual(
  products[0].validationErrors,
  [],
  "valid Shopify-native CSV row should have no validation errors",
);
console.log("Shopify-native header mapping test passed");
