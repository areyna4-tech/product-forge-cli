import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";

import * as csvMapper from "../src/lib/csv-mapper";

const firstBlockingCsvParseError = (
  csvMapper as unknown as {
    firstBlockingCsvParseError?: (
      errors: Papa.ParseError[],
      rows: Record<string, string>[],
    ) => string | null;
  }
).firstBlockingCsvParseError;

assert.equal(
  typeof firstBlockingCsvParseError,
  "function",
  "CSV parse diagnostics need one shared production decision function",
);

const malformed = Papa.parse<Record<string, string>>('Title,SKU\n"Unclosed,SKU-1', {
  header: true,
  skipEmptyLines: false,
});
assert.ok(
  firstBlockingCsvParseError!(malformed.errors, malformed.data),
  "an unterminated quote must block partial CSV data",
);

const blankLine = Papa.parse<Record<string, string>>("Title,SKU\nFirst,FIRST\n\nThird,THIRD\n", {
  header: true,
  skipEmptyLines: false,
});
assert.equal(
  firstBlockingCsvParseError!(blankLine.errors, blankLine.data),
  null,
  "a retained physical blank line must not be treated as a malformed CSV",
);

const uiSource = readFileSync("src/routes/index.tsx", "utf8");
const mcpSource = readFileSync("src/lib/mcp/tools/check-shopify-csv.ts", "utf8");
assert.match(
  uiSource,
  /firstBlockingCsvParseError\(results\.errors,\s*parsedRows\)/,
  "the upload flow must reject blocking parser diagnostics before accepting partial data",
);
assert.match(
  mcpSource,
  /firstBlockingCsvParseError\(parsed\.errors,\s*parsed\.data\)/,
  "the MCP checker must reject blocking parser diagnostics before accepting partial data",
);

console.log("CSV parse-error regression test passed");
