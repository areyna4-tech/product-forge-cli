import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_shopify_import_blockers",
  title: "List Shopify import blockers",
  description:
    "Return the common Shopify product CSV import blockers ProductCSVFixer checks for, with a short explanation of each.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const blockers = [
      {
        id: "missing_title",
        severity: "error",
        summary: "Rows missing a product title are rejected by Shopify's importer.",
      },
      {
        id: "missing_sku",
        severity: "error",
        summary: "Rows without a SKU cannot be tracked or updated on re-import.",
      },
      {
        id: "invalid_price",
        severity: "error",
        summary: "Price is missing, non-numeric, or contains currency symbols Shopify rejects.",
      },
      {
        id: "duplicate_sku",
        severity: "warning",
        summary: "Two or more rows share the same SKU, which collides on import.",
      },
      {
        id: "duplicate_handle",
        severity: "warning",
        summary: "Two rows produce the same handle, causing Shopify to overwrite one product.",
      },
      {
        id: "invalid_image_url",
        severity: "warning",
        summary: "Image URL is not a valid http(s) URL, so Shopify cannot fetch the asset.",
      },
      {
        id: "compare_at_less_than_price",
        severity: "warning",
        summary: "Compare-at price is lower than price; the sale badge will not show.",
      },
      {
        id: "cost_exceeds_price",
        severity: "warning",
        summary: "Cost is higher than price, producing a negative margin.",
      },
      {
        id: "negative_quantity",
        severity: "warning",
        summary: "Negative inventory quantity — likely a source-file mistake.",
      },
      {
        id: "barcode_contains_letters",
        severity: "warning",
        summary: "Barcodes should be numeric (UPC/EAN); letters usually indicate a wrong column.",
      },
    ];
    return {
      content: [
        {
          type: "text",
          text: `${blockers.length} Shopify CSV import blockers checked by ProductCSVFixer.`,
        },
      ],
      structuredContent: { blockers },
    };
  },
});
