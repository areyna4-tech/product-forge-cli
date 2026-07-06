import { defineTool } from "@lovable.dev/mcp-js";
import Papa from "papaparse";
import { z } from "zod";

import {
  autoMapHeaders,
  defaultSettings,
  summarize,
  transformRows,
  validateProducts,
} from "@/lib/csv-mapper";

export default defineTool({
  name: "check_shopify_csv",
  title: "Check Shopify CSV",
  description:
    "Run ProductCSVFixer's pre-flight checker on a product CSV. Returns Shopify import blocker counts (missing SKUs, invalid prices, duplicate SKUs, image URL issues, required field problems) plus per-row issues. Runs on raw CSV text — no files uploaded, no data stored.",
  inputSchema: {
    csv: z
      .string()
      .min(1)
      .describe("Raw CSV text (with a header row) to validate against Shopify's product import requirements."),
    max_row_issues: z
      .number()
      .int()
      .min(0)
      .max(500)
      .optional()
      .describe("Maximum per-row issue entries to return. Defaults to 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ csv, max_row_issues }) => {
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && !parsed.data.length) {
      return {
        content: [{ type: "text", text: `CSV parse failed: ${parsed.errors[0].message}` }],
        isError: true,
      };
    }

    const headers = parsed.meta.fields ?? [];
    const mappings = autoMapHeaders(headers);
    const products = validateProducts(
      transformRows(parsed.data, mappings, defaultSettings),
      defaultSettings,
    );
    const summary = summarize(products);

    const limit = max_row_issues ?? 100;
    const rowIssues = products
      .filter((p) => p.validationErrors.length > 0)
      .slice(0, limit)
      .map((p) => ({
        row: p.sourceRowId,
        issues: p.validationErrors,
      }));

    const unmappedRequired = ["title", "sku", "price"].filter(
      (f) => !mappings.some((m) => m.destinationField === f),
    );

    const structured = {
      summary,
      detected_headers: headers,
      unmapped_required_fields: unmappedRequired,
      row_issues: rowIssues,
      row_issues_truncated: products.filter((p) => p.validationErrors.length > 0).length > limit,
    };

    return {
      content: [
        {
          type: "text",
          text:
            `Checked ${summary.totalRows} rows: ${summary.exportableRows} exportable, ` +
            `${summary.blockedRows} blocked, ${summary.warningRows} with warnings. ` +
            `Missing required: ${summary.missingRequiredIssues}, invalid prices: ${summary.invalidPriceIssues}, ` +
            `duplicate SKUs: ${summary.duplicateSkuIssues}, invalid image URLs: ${summary.invalidImageUrlIssues}.`,
        },
      ],
      structuredContent: structured,
    };
  },
});
