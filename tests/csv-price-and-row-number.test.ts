import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";

import {
  autoMapHeaders,
  defaultSettings,
  parseCurrency,
  parseInteger,
  transformRows,
  validateProducts,
} from "../src/lib/csv-mapper";

assert.equal(parseCurrency("44,95"), 44.95, "decimal-comma prices must not be inflated by 100x");
assert.equal(parseCurrency("1,234.56"), 1234.56, "US thousands separators must be normalized");
assert.equal(
  parseCurrency("1.234,56"),
  1234.56,
  "EU thousands and decimal separators must be normalized",
);
assert.equal(parseCurrency("1,2,3"), null, "malformed comma grouping must be rejected");
assert.equal(parseCurrency("1.2.3"), null, "malformed dot grouping must be rejected");
assert.equal(parseCurrency("12abc"), null, "attached letters must not be stripped from prices");
assert.equal(
  parseCurrency("1e3"),
  null,
  "scientific-looking malformed prices must not change meaning",
);
assert.equal(
  parseCurrency("USD 12.50"),
  12.5,
  "a separated leading currency code remains supported",
);
assert.equal(
  parseInteger("1.5"),
  null,
  "fractional inventory must not be changed into a different integer",
);
assert.equal(parseInteger("12abc"), null, "inventory containing letters must be rejected");
assert.equal(parseInteger("-12"), -12, "signed whole-number inventory must remain supported");

const [malformedPrice] = validateProducts(
  transformRows(
    [{ Title: "Broken price", SKU: "BROKEN", Price: "1,2,3" }],
    autoMapHeaders(["Title", "SKU", "Price"]),
    defaultSettings,
  ),
  defaultSettings,
);
assert.ok(
  malformedPrice.validationErrors.some(
    (issue) => issue.field === "price" && issue.severity === "error",
  ),
  "a nonblank malformed price must be blocked rather than treated as an optional blank price",
);

const [malformedOptionalNumbers] = validateProducts(
  transformRows(
    [
      {
        Title: "Broken optional numbers",
        SKU: "BROKEN-OPTIONAL",
        Price: "10",
        "Compare at price": "12abc",
        "Cost per item": "1e3",
        "Weight value (grams)": "2kg",
      },
    ],
    autoMapHeaders([
      "Title",
      "SKU",
      "Price",
      "Compare at price",
      "Cost per item",
      "Weight value (grams)",
    ]),
    defaultSettings,
  ),
  defaultSettings,
);
for (const field of ["compareAtPrice", "cost", "weight"]) {
  assert.ok(
    malformedOptionalNumbers.validationErrors.some(
      (issue) => issue.field === field && issue.severity === "error",
    ),
    `a malformed nonblank ${field} must be blocked instead of silently exported blank`,
  );
}

for (const transform of ["none", "trim"] as const) {
  const mappings = autoMapHeaders(["Title", "SKU", "Price", "Quantity"]);
  for (const mapping of mappings) {
    if (mapping.destinationField === "price" || mapping.destinationField === "quantity") {
      mapping.transform = transform;
    }
  }
  const [malformedWithOverride] = validateProducts(
    transformRows(
      [{ Title: "Malformed transform override", SKU: "OVERRIDE", Price: "12abc", Quantity: "1.5" }],
      mappings,
      defaultSettings,
    ),
    defaultSettings,
  );
  for (const field of ["price", "quantity"]) {
    assert.ok(
      malformedWithOverride.validationErrors.some(
        (issue) => issue.field === field && issue.severity === "error",
      ),
      `${field} must stay blocked when the ${transform} transform is selected`,
    );
  }
}

const rows = [
  { Title: "First", SKU: "FIRST", Price: "10" },
  { Title: "", SKU: "", Price: "" },
  { Title: "Third", SKU: "THIRD", Price: "30" },
];
const products = validateProducts(
  transformRows(rows, autoMapHeaders(["Title", "SKU", "Price"]), defaultSettings),
  defaultSettings,
);
assert.equal(products[1].sourceRowId, 3, "reported row numbers must preserve blank source rows");

const routeSource = readFileSync("src/routes/index.tsx", "utf8");
assert.match(
  routeSource,
  /skipEmptyLines:\s*false/,
  "the production upload parser must preserve blank physical rows before transformation",
);
const mcpSource = readFileSync("src/lib/mcp/tools/check-shopify-csv.ts", "utf8");
assert.match(
  mcpSource,
  /skipEmptyLines:\s*false/,
  "the MCP checker must preserve blank physical rows before transformation",
);
const productionCsv = "Title,SKU,Price\nFirst,FIRST,10\n\nThird,THIRD,30\n";
const parsed = Papa.parse<Record<string, string>>(productionCsv, {
  header: true,
  skipEmptyLines: false,
});
const productionProducts = validateProducts(
  transformRows(parsed.data, autoMapHeaders(parsed.meta.fields ?? []), defaultSettings),
  defaultSettings,
);
assert.equal(
  productionProducts[1].sourceRowId,
  3,
  "production-style Papa Parse input must retain the original physical row position",
);

console.log("CSV price and source-row regression test passed");
