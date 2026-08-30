import assert from "node:assert/strict";
import {
  autoMapHeaders,
  buildShopifyRows,
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

const currentHeaders = [
  "Title",
  "URL handle",
  "SKU",
  "Price",
  "Product image URL",
  "Variant image URL",
  "Weight value (grams)",
  "Published on online store",
  "Status",
  "Charge tax",
  "Inventory tracker",
  "Requires shipping",
  "Fulfillment service",
];
const currentMappings = autoMapHeaders(currentHeaders);
assert.ok(
  currentMappings.some(
    (mapping) =>
      mapping.destinationField === "imageUrl" && mapping.sourceColumn === "Product image URL",
  ),
  "Shopify's current product-image header must map intentionally",
);
assert.ok(
  currentMappings.some(
    (mapping) =>
      mapping.destinationField === "weight" && mapping.sourceColumn === "Weight value (grams)",
  ),
  "Shopify's current weight header must map intentionally",
);
assert.equal(
  autoMapHeaders(["Collection"]).some((mapping) => mapping.destinationField === "category"),
  false,
  "an arbitrary collection must not be treated as a Shopify taxonomy category",
);

const [currentProduct] = validateProducts(
  transformRows(
    [
      {
        Title: "Digital draft",
        "URL handle": "digital-draft",
        SKU: "digital-1",
        Price: "12.00",
        "Product image URL": "https://example.com/digital.jpg",
        "Variant image URL": "https://example.com/digital-variant.jpg",
        "Weight value (grams)": "0",
        "Published on online store": "false",
        Status: "draft",
        "Charge tax": "false",
        "Inventory tracker": "",
        "Requires shipping": "false",
        "Fulfillment service": "manual",
        "Price / International": "14.00",
        "Compare-at price / International": "18.00",
        Collection: "Summer",
        "Image position": "3",
        "Image alt text": "Digital download preview",
        "Weight unit for display": "kg",
        "Included / International": "true",
        "Metafield: custom.license [single_line_text_field]": "Standard",
        "Fabric (product.metafields.shopify.fabric)": "Cotton",
        "Option1 LinkedTo": "product.metafields.shopify.color-pattern",
        "Google Shopping / Google Product Category": "Apparel & Accessories",
        "Google Shopping / Gender": "unisex",
      },
    ],
    currentMappings,
    defaultSettings,
  ),
  defaultSettings,
);
const [currentExport] = buildShopifyRows([currentProduct]);
assert.equal(currentExport["Image Src"], "https://example.com/digital.jpg");
assert.equal(currentExport["Variant Grams"], 0);
assert.equal(currentExport["Published"], "FALSE", "unpublished source state must survive export");
assert.equal(currentExport["Status"], "draft", "draft source status must survive export");
assert.equal(
  currentExport["Variant Taxable"],
  "FALSE",
  "non-taxable source state must survive export",
);
assert.equal(
  currentExport["Variant Inventory Tracker"],
  "",
  "untracked inventory must not be changed to Shopify-tracked inventory",
);
assert.equal(
  currentExport["Variant Requires Shipping"],
  "FALSE",
  "digital products must not be changed into shippable products",
);
assert.equal(currentExport["Variant Fulfillment Service"], "manual");
assert.equal(currentExport["Variant Inventory Qty"], "", "missing inventory must remain blank");
assert.equal(
  currentExport["Price / International"],
  "14.00",
  "market-specific Shopify prices must survive export",
);
assert.equal(
  currentExport["Compare-at price / International"],
  "18.00",
  "market-specific Shopify compare-at prices must survive export",
);
assert.equal(
  currentExport["Collection"],
  "Summer",
  "Collection must survive without becoming category",
);
assert.equal(currentExport["Image Position"], "3", "source image position must survive export");
assert.equal(
  currentExport["Image Alt Text"],
  "Digital download preview",
  "source image alt text must survive export",
);
assert.equal(currentExport["Weight unit for display"], "kg");
assert.equal(currentExport["Included / International"], "true");
assert.equal(
  currentExport["Metafield: custom.license [single_line_text_field]"],
  "Standard",
  "Shopify metafields must survive export",
);
assert.equal(
  currentExport["Fabric (product.metafields.shopify.fabric)"],
  "Cotton",
  "Shopify's named product-metafield headers must survive export",
);
assert.equal(
  currentExport["Variant Image"],
  "https://example.com/digital-variant.jpg",
  "a variant image must survive when the product image is also present",
);
assert.equal(
  currentExport["Option1 LinkedTo"],
  "product.metafields.shopify.color-pattern",
  "Shopify linked-option metadata must survive export",
);
assert.equal(
  currentExport["Google Shopping / Google Product Category"],
  "Apparel & Accessories",
  "Shopify Google Shopping categories must survive export",
);
assert.equal(
  currentExport["Google Shopping / Gender"],
  "unisex",
  "Shopify Google Shopping attributes must survive export",
);

const [noStatusProduct] = validateProducts(
  transformRows(
    [{ Title: "No explicit status", SKU: "STATUS-DEFAULT", Price: "10" }],
    autoMapHeaders(["Title", "SKU", "Price"]),
    defaultSettings,
  ),
  defaultSettings,
);
assert.equal(
  buildShopifyRows([noStatusProduct])[0]["Status"],
  "active",
  "an emitted Status column must contain Shopify's default active value",
);

const [invalidShopifyFlags] = validateProducts(
  transformRows(
    [
      {
        Title: "Invalid Shopify flags",
        SKU: "INVALID-FLAGS",
        Price: "10",
        Published: "maybe",
        Status: "launching",
        "Requires shipping": "sometimes",
        "Charge tax": "perhaps",
        "Gift card": "occasionally",
      },
    ],
    autoMapHeaders([
      "Title",
      "SKU",
      "Price",
      "Published",
      "Status",
      "Requires shipping",
      "Charge tax",
      "Gift card",
    ]),
    defaultSettings,
  ),
  defaultSettings,
);
for (const field of ["published", "status", "requiresShipping", "taxable", "giftCard"]) {
  assert.ok(
    invalidShopifyFlags.validationErrors.some(
      (issue) => issue.field === field && issue.severity === "error",
    ),
    `invalid Shopify ${field} values must block export`,
  );
}
console.log("Shopify-native header mapping test passed");
