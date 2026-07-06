import { defineMcp } from "@lovable.dev/mcp-js";

import checkShopifyCsv from "./tools/check-shopify-csv";
import listShopifyImportBlockers from "./tools/list-shopify-import-blockers";

export default defineMcp({
  name: "productcsvfixer-mcp",
  title: "ProductCSVFixer",
  version: "0.1.0",
  instructions:
    "Pre-flight checker for Shopify product CSV imports. Use `check_shopify_csv` to validate a CSV against Shopify's import rules (missing SKUs, invalid prices, duplicate SKUs/handles, image URL issues, required fields). Use `list_shopify_import_blockers` to see what is checked. Uploaded CSV text is validated in-memory and not stored.",
  tools: [checkShopifyCsv, listShopifyImportBlockers],
});
