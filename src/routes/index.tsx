import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Upload, FileText, Download, Copy, RotateCcw, AlertCircle, CheckCircle2,
  AlertTriangle, FileSpreadsheet, Sparkles, Settings as SettingsIcon,
  ChevronDown, ChevronRight, Shield, Check, ListFilter, Wrench,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ALL_DEST_FIELDS, REQUIRED_FIELDS, TRANSFORM_OPTIONS, SAMPLE_CSV,
  autoMapHeaders, applyTransform, buildGenericRows, buildShopifyRows, buildWooCommerceRows,
  defaultSettings, defaultTransformFor, summarize, transformRows, validateProducts,
  type ColumnMapping, type ExportTemplate, type MapperSettings, type ProductRecord,
  type TransformRule,
} from "@/lib/csv-mapper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Product CSV Cleaner & Exporter" },
      { name: "description", content: "Turn messy product spreadsheets into Shopify, WooCommerce, or clean import-ready CSVs. Runs entirely in your browser." },
      { property: "og:title", content: "Product CSV Cleaner & Exporter" },
      { property: "og:description", content: "Turn messy product spreadsheets into Shopify, WooCommerce, or clean import-ready CSVs." },
    ],
  }),
  component: Index,
});

const FIELD_LABELS: Record<string, string> = {
  title: "Title", sku: "SKU", price: "Price", handle: "Handle",
  description: "Description", vendor: "Vendor", brand: "Brand",
  category: "Category", productType: "Product Type", tags: "Tags",
  compareAtPrice: "Compare At Price", cost: "Cost", quantity: "Quantity",
  weight: "Weight", barcode: "Barcode", imageUrl: "Image URL",
  additionalImageUrls: "Additional Image URLs",
  option1Name: "Option 1 Name", option1Value: "Option 1 Value",
  option2Name: "Option 2 Name", option2Value: "Option 2 Value",
  option3Name: "Option 3 Name", option3Value: "Option 3 Value",
  isActive: "Active", seoTitle: "SEO Title", seoDescription: "SEO Description",
};

const TRANSFORM_LABELS: Record<TransformRule, string> = {
  none: "No change",
  trim: "Trim whitespace",
  lowercase: "Lowercase",
  uppercase: "Uppercase",
  title_case: "Title case",
  slugify: "Generate URL handle",
  currency_to_number: "Convert currency to number",
  integer: "Convert to whole number",
  decimal_2: "Format to 2 decimals",
  split_comma: "Split comma-separated values",
  url_clean: "Clean image URL",
  boolean_active: "Convert to active/inactive",
};

const TARGET_META: Record<ExportTemplate, { title: string; desc: string; ctaLabel: string; filename: string }> = {
  generic: { title: "Clean CSV", desc: "For normalized product data, marketplace uploads, or custom imports.", ctaLabel: "Download Clean CSV", filename: "products.csv" },
  shopify: { title: "Shopify Product CSV", desc: "Shopify-compatible product import structure.", ctaLabel: "Download Shopify CSV", filename: "shopify-products.csv" },
  woocommerce: { title: "WooCommerce Product CSV", desc: "WooCommerce-compatible product import structure.", ctaLabel: "Download WooCommerce CSV", filename: "woocommerce-products.csv" },
};

const NO_SOURCE = "__none__";

type DestField = keyof ProductRecord;

const OPTIONAL_GROUPS: { title: string; fields: DestField[] }[] = [
  { title: "Product details", fields: ["description", "vendor", "brand", "category", "productType", "tags"] },
  { title: "Pricing & inventory", fields: ["compareAtPrice", "cost", "quantity", "weight", "barcode", "isActive"] },
  { title: "Images", fields: ["imageUrl", "additionalImageUrls"] },
  { title: "Variants", fields: ["option1Name", "option1Value", "option2Name", "option2Value", "option3Name", "option3Value"] },
  { title: "SEO", fields: ["seoTitle", "seoDescription"] },
];

type IssueInfo = { problem: string; current: string; expected: string; fix: string };

function describeIssue(
  p: ProductRecord,
  e: ProductRecord["validationErrors"][number],
  mappings: ColumnMapping[],
): IssueInfo {
  const m = mappings.find((x) => x.destinationField === e.field);
  const raw = m ? (p.rawSource[m.sourceColumn] ?? "") : "";
  const fieldVal = (p as any)[e.field];
  const currentRaw = raw !== "" ? raw : (fieldVal == null || fieldVal === "" ? "" : String(fieldVal));

  if (e.field === "title" && e.message === "Title is required") {
    return { problem: "Required field is missing.", current: currentRaw, expected: "Product title", fix: "Add a product title in the source CSV." };
  }
  if (e.field === "sku" && e.message === "SKU is required") {
    return { problem: "Required field is missing.", current: currentRaw, expected: "A unique product code like ABC-123", fix: "Add a SKU in the source CSV." };
  }
  if (e.field === "sku" && e.message === "Duplicate SKU") {
    return { problem: "SKU is used by more than one row.", current: currentRaw, expected: "A unique SKU per row", fix: "Change one of the duplicate SKUs so each row is unique." };
  }
  if (e.field === "price" && e.message === "Price is invalid or missing") {
    return { problem: "Price is not a valid number.", current: currentRaw, expected: "A number like 29.99", fix: "Replace with a numeric price, then re-upload the CSV." };
  }
  if (e.field === "price" && e.message === "Price is zero or negative") {
    return { problem: "Price is zero or negative.", current: currentRaw, expected: "A positive number like 29.99", fix: "Set a positive price greater than zero." };
  }
  if (e.field === "compareAtPrice") {
    return { problem: "Compare-at price is lower than price.", current: currentRaw, expected: "A value higher than the price, or leave it blank", fix: "Increase the compare-at price or remove it." };
  }
  if (e.field === "cost") {
    return { problem: "Cost is higher than the price.", current: currentRaw, expected: "A cost lower than the price", fix: "Lower the cost or raise the price." };
  }
  if (e.field === "quantity") {
    return { problem: "Quantity is negative.", current: currentRaw, expected: "Zero or a positive whole number", fix: "Set quantity to 0 or higher." };
  }
  if (e.field === "imageUrl") {
    return { problem: "Image URL may not be valid.", current: currentRaw, expected: "A full URL starting with https://", fix: "Use a complete image URL such as https://example.com/blue-shirt.jpg." };
  }
  if (e.field === "barcode") {
    return { problem: "Barcode contains letters.", current: currentRaw, expected: "Digits only (UPC, EAN, or GTIN)", fix: "Remove letters so only digits remain." };
  }
  return { problem: e.message, current: currentRaw, expected: "Valid value for this field", fix: "Update the value in the source CSV and re-upload." };
}

function Index() {
  const [filename, setFilename] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [settings, setSettings] = useState<MapperSettings>(defaultSettings);
  const [target, setTarget] = useState<ExportTemplate>("generic");
  const [error, setError] = useState<string>("");
  const [previewFilter, setPreviewFilter] = useState<"all" | "exportable" | "warning" | "error">("exportable");
  const [issueFilter, setIssueFilter] = useState<"all" | "blocking" | "warnings">("all");
  const [howToFixOpen, setHowToFixOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hideEmptyCols, setHideEmptyCols] = useState(true);
  const [copyStatus, setCopyStatus] = useState<{
    type: "success" | "warning";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyStatusTimeoutRef = useRef<number | null>(null);

  const hasFile = sourceRows.length > 0;

  const products = useMemo(() => {
    if (!sourceRows.length) return [];
    return validateProducts(transformRows(sourceRows, mappings, settings), settings);
  }, [sourceRows, mappings, settings]);

  const summary = useMemo(() => summarize(products), [products]);

  const exportRows = useMemo(() => {
    const valid = products.filter((p) => !p.validationErrors.some((e) => e.severity === "error"));
    if (target === "shopify") return buildShopifyRows(valid);
    if (target === "woocommerce") return buildWooCommerceRows(valid);
    return buildGenericRows(valid);
  }, [products, target]);

  const previewExportRows = useMemo(() => {
    let filtered = products;
    if (previewFilter === "valid") filtered = products.filter((p) => p.validationErrors.length === 0);
    else if (previewFilter === "warning") filtered = products.filter((p) => p.validationErrors.some((e) => e.severity === "warning") && !p.validationErrors.some((e) => e.severity === "error"));
    else if (previewFilter === "error") filtered = products.filter((p) => p.validationErrors.some((e) => e.severity === "error"));
    const rows = target === "shopify" ? buildShopifyRows(filtered)
      : target === "woocommerce" ? buildWooCommerceRows(filtered)
      : buildGenericRows(filtered);
    return rows.slice(0, 25).map((r, i) => ({ row: r, product: filtered[i] }));
  }, [products, target, previewFilter]);

  const parseCsvText = useCallback((text: string, name: string) => {
    const cleaned = text.replace(/^\uFEFF/, "");
    Papa.parse<Record<string, string>>(cleaned, {
      header: true,
      skipEmptyLines: "greedy",
      transform: (v) => (v == null ? "" : String(v)),
      complete: (results) => {
        const hdrs = (results.meta.fields || []).filter(Boolean);
        if (!hdrs.length) {
          setError("CSV has no headers. Make sure the first row contains column names.");
          return;
        }
        const rows = (results.data || []).filter((r) =>
          hdrs.some((h) => {
            const v = r?.[h];
            return v != null && String(v).trim() !== "";
          }),
        );
        if (!rows.length) {
          setError("CSV is empty. No data rows found.");
          return;
        }
        setError("");
        setFilename(name);
        setHeaders(hdrs);
        setSourceRows(rows);
        setMappings(autoMapHeaders(hdrs));
        toast.success(`Loaded ${rows.length} rows from ${name}`);
      },
      error: (err: Error) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setError("Invalid file type. Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => parseCsvText(String(reader.result || ""), file.name);
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }, [parseCsvText]);

  const loadSample = () => parseCsvText(SAMPLE_CSV, "sample-products.csv");

  const reset = () => {
    setFilename(""); setHeaders([]); setSourceRows([]); setMappings([]);
    setSettings(defaultSettings); setTarget("generic"); setError("");
    setPreviewFilter("all"); setOptionalOpen(false); setAdvancedOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Reset complete");
  };

  const replaceFile = () => {
    fileInputRef.current?.click();
  };

  const updateMapping = (field: keyof ProductRecord, sourceColumn: string, transform?: TransformRule) => {
    setMappings((prev) => {
      const idx = prev.findIndex((m) => m.destinationField === field);
      if (sourceColumn === NO_SOURCE || !sourceColumn) {
        return prev.filter((m) => m.destinationField !== field);
      }
      const tr = transform || (idx >= 0 ? prev[idx].transform : defaultTransformFor(field));
      const next: ColumnMapping = { sourceColumn, destinationField: field, transform: tr };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
  };

  const updateTransform = (field: keyof ProductRecord, transform: TransformRule) => {
    setMappings((prev) => prev.map((m) => m.destinationField === field ? { ...m, transform } : m));
  };

  const clearMapping = (field: keyof ProductRecord) => {
    setMappings((prev) => prev.filter((m) => m.destinationField !== field));
  };

  const sampleTransformed = (field: keyof ProductRecord): string => {
    const m = mappings.find((x) => x.destinationField === field);
    if (!m || !sourceRows.length) return "";
    const v = sourceRows[0][m.sourceColumn] ?? "";
    const t = applyTransform(v, m.transform);
    if (Array.isArray(t)) return t.join(", ");
    if (t == null) return "";
    return String(t);
  };

  const downloadCsv = (rows: Record<string, any>[], name: string) => {
    if (!rows.length) {
      toast.error("No rows available to export");
      return;
    }
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const requiredMapped = REQUIRED_FIELDS.every((f) => mappings.some((m) => m.destinationField === f));
    if (!requiredMapped) {
      toast.error("Map required fields (Title, SKU, Price) before exporting.");
      return;
    }
    if (!exportRows.length) {
      toast.error("No valid rows available for export.");
      return;
    }
    downloadCsv(exportRows, TARGET_META[target].filename);
    toast.success(`Exported ${exportRows.length} rows`);
  };

  const handleValidationReport = () => {
    const rows: Record<string, any>[] = [];
    for (const p of products) {
      for (const e of p.validationErrors) {
        rows.push({
          sourceRowId: p.sourceRowId, sku: p.sku, title: p.title,
          field: e.field, severity: e.severity, message: e.message,
        });
      }
    }
    if (!rows.length) { toast.info("No validation issues to report."); return; }
    downloadCsv(rows, "validation-report.csv");
  };

  const buildMappingJson = () => JSON.stringify({
    target,
    sourceHeaders: headers,
    mappings: mappings.map((m) => ({
      destinationField: m.destinationField,
      sourceColumn: m.sourceColumn,
      transform: m.transform,
    })),
    settings,
  }, null, 2);

  const downloadMappingJson = () => {
    const data = buildMappingJson();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "product-csv-mapping.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const legacyCopy = (text: string): boolean => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyMapping = async () => {
    const data = buildMappingJson();
    if (copyStatusTimeoutRef.current) {
      window.clearTimeout(copyStatusTimeoutRef.current);
      copyStatusTimeoutRef.current = null;
    }
    let copied = false;
    if (navigator.clipboard?.writeText) {
      copied = await Promise.race<boolean>([
        navigator.clipboard.writeText(data).then(() => true, () => false),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 300)),
      ]);
    }
    if (!copied) copied = legacyCopy(data);

    if (copied) {
      setCopyStatus({ type: "success", message: "Mapping JSON copied." });
      toast.success("Mapping JSON copied.");
    } else {
      downloadMappingJson();
      setCopyStatus({ type: "warning", message: "Clipboard unavailable. Downloading mapping JSON instead." });
      toast.warning("Clipboard unavailable. Downloading mapping JSON instead.", { duration: 4000 });
    }
    copyStatusTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null);
      copyStatusTimeoutRef.current = null;
    }, 8000);
  };

  const previewHeaders = useMemo(() => {
    if (!previewExportRows.length) return [];
    const all = Object.keys(previewExportRows[0].row);
    if (!hideEmptyCols) return all;
    return all.filter((h) =>
      previewExportRows.some(({ row }) => {
        const v = row[h];
        return v != null && String(v).trim() !== "";
      }),
    );
  }, [previewExportRows, hideEmptyCols]);

  const requiredFields = ALL_DEST_FIELDS.filter((f) => REQUIRED_FIELDS.includes(f));
  const optionalFields = ALL_DEST_FIELDS.filter((f) => !REQUIRED_FIELDS.includes(f));
  const requiredMappedCount = REQUIRED_FIELDS.filter((f) => mappings.some((m) => m.destinationField === f)).length;
  const allRequiredMapped = requiredMappedCount === REQUIRED_FIELDS.length;

  const blockingIssues = useMemo(
    () => products.flatMap((p) => p.validationErrors.filter((e) => e.severity === "error").map((e) => ({ p, e }))),
    [products],
  );
  const warningIssues = useMemo(
    () => products.flatMap((p) => p.validationErrors.filter((e) => e.severity === "warning").map((e) => ({ p, e }))),
    [products],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster position="top-right" duration={3500} richColors closeButton offset={16} />

      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Product CSV Cleaner &amp; Exporter</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Turn messy product spreadsheets into Shopify, WooCommerce, or clean import-ready CSVs.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />No signup required</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" />Runs locally in your browser</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" />Shopify/WooCommerce ready</span>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-6xl px-6 py-8 space-y-6 ${hasFile ? "pb-40 sm:pb-32" : "pb-12"}`}>
        {/* Step 1 — Upload */}
        <section>
          <StepHeader number={1} title="Upload CSV" active />
          <Card>
            <CardContent className="pt-6">
              {!hasFile ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFile(f);
                    }}
                    className={`rounded-lg border-2 border-dashed p-10 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">Drop your CSV here</p>
                    <p className="text-xs text-muted-foreground">or</p>
                    <div className="mt-3 flex justify-center gap-2 flex-wrap">
                      <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                        Browse CSV file
                      </Button>
                      <Button size="sm" variant="outline" onClick={loadSample}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />Try sample file
                      </Button>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="mt-6 rounded-md border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">How it works</p>
                    <ol className="grid gap-3 sm:grid-cols-4 text-sm">
                      {["Upload", "Auto-map", "Validate", "Export"].map((step, i) => (
                        <li key={step} className="flex items-center gap-2">
                          <span className="grid place-items-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-medium">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Trust note */}
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    Your file stays in your browser.
                  </p>
                </>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {sourceRows.length} rows · {headers.length} columns
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {headers.slice(0, 8).map((h) => (
                          <Badge key={h} variant="outline" className="font-mono text-[10px] py-0">{h}</Badge>
                        ))}
                        {headers.length > 8 && (
                          <Badge variant="outline" className="text-[10px] py-0">+{headers.length - 8} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={replaceFile} className="shrink-0">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />Replace file
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </section>

        {hasFile && (
          <>
            {/* Step 2 — Choose export format */}
            <section>
              <StepHeader number={2} title="Choose export format" active />
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["generic", "shopify", "woocommerce"] as const).map((id) => {
                      const t = TARGET_META[id];
                      const selected = target === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setTarget(id)}
                          aria-pressed={selected}
                          className={`relative text-left rounded-lg border p-4 transition-colors ${selected ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:border-foreground/30"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span className="font-medium text-sm">{t.title}</span>
                            </div>
                            {selected && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                                <Check className="h-3 w-3" /> Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Step 3 — Review field mapping */}
            <section>
              <StepHeader number={3} title="Review field mapping" active />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Required fields</CardTitle>
                  <CardDescription>
                    {allRequiredMapped
                      ? "All required fields are mapped."
                      : `${requiredMappedCount} of ${REQUIRED_FIELDS.length} required fields mapped.`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requiredFields.map((field) => (
                    <MappingRow
                      key={field}
                      field={field}
                      required
                      headers={headers}
                      mapping={mappings.find((m) => m.destinationField === field)}
                      sample={sampleTransformed(field)}
                      onUpdate={updateMapping}
                      onTransform={updateTransform}
                      onClear={clearMapping}
                    />
                  ))}
                </CardContent>
              </Card>

              <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen} className="mt-4">
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {optionalOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            Optional fields
                          </CardTitle>
                          <CardDescription>
                            Optional fields · {optionalFields.length} fields available
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {mappings.filter((m) => !REQUIRED_FIELDS.includes(m.destinationField)).length} mapped
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {optionalFields.map((field) => (
                        <MappingRow
                          key={field}
                          field={field}
                          headers={headers}
                          mapping={mappings.find((m) => m.destinationField === field)}
                          sample={sampleTransformed(field)}
                          onUpdate={updateMapping}
                          onTransform={updateTransform}
                          onClear={clearMapping}
                        />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Advanced settings */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-4">
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="cursor-pointer">
                      <CardTitle className="text-base flex items-center gap-2">
                        {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <SettingsIcon className="h-4 w-4" />
                        Advanced settings
                      </CardTitle>
                      <CardDescription>Defaults and global transformations.</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Default currency</Label>
                          <Input
                            value={settings.defaultCurrency}
                            onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Default vendor</Label>
                          <Input
                            value={settings.defaultVendor}
                            onChange={(e) => setSettings({ ...settings, defaultVendor: e.target.value })}
                            className="h-8"
                            placeholder="Leave blank if none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Default weight unit</Label>
                          <Select
                            value={settings.defaultWeightUnit}
                            onValueChange={(v) => setSettings({ ...settings, defaultWeightUnit: v as any })}
                          >
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["g", "kg", "lb", "oz"] as const).map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {[
                          ["titleCaseTitles", "Convert product titles to title case"],
                          ["uppercaseSkus", "Convert SKUs to uppercase"],
                          ["generateHandles", "Generate missing handles from title"],
                          ["fallbackDescriptionFromTitle", "Use title as fallback description"],
                          ["removeBlankRows", "Remove duplicate blank rows"],
                          ["warnDuplicateSkus", "Warn on duplicate SKUs"],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={(settings as any)[key]}
                              onCheckedChange={(v) => setSettings({ ...settings, [key]: !!v } as MapperSettings)}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </section>

            {/* Step 4 — Validate & export */}
            <section>
              <StepHeader number={4} title="Validate & export" active />

              {/* Validation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Validation</CardTitle>
                  <CardDescription>Check for missing required fields, invalid prices, duplicate SKUs, and image URL issues.</CardDescription>
                </CardHeader>
                <CardContent>
                  {blockingIssues.length === 0 && warningIssues.length === 0 ? (
                    <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-emerald-800">No validation issues found.</p>
                        <p className="text-emerald-700">Your CSV is ready to export.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blockingIssues.length > 0 && (
                        <IssueGroup
                          title="Blocking errors"
                          description="These rows will be excluded from export."
                          tone="error"
                          issues={blockingIssues}
                        />
                      )}
                      {warningIssues.length > 0 && (
                        <IssueGroup
                          title="Warnings"
                          description="These rows will still be exported. Review for accuracy."
                          tone="warning"
                          issues={warningIssues}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export readiness */}
              <Card className="mt-4">
                <CardContent className="pt-6">
                  {allRequiredMapped && summary.exportableRows > 0 ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <p className="font-medium">Ready to export</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {summary.exportableRows} of {summary.totalRows} rows are exportable.{" "}
                          {summary.blockedRows === 0 ? "No blocking errors found." : `${summary.blockedRows} blocked by errors.`}
                        </p>
                      </div>
                      <Button onClick={handleDownload} className="shrink-0">
                        <Download className="h-4 w-4 mr-1.5" />
                        {TARGET_META[target].ctaLabel}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Not ready to export</p>
                        <p className="text-muted-foreground">
                          {!allRequiredMapped
                            ? "Map all required fields (Title, SKU, Price) to enable export."
                            : "No exportable rows yet — every row has a blocking error."}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output Preview */}
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-base">Output preview</CardTitle>
                      <CardDescription>First 25 transformed rows for {TARGET_META[target].title}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Switch checked={hideEmptyCols} onCheckedChange={setHideEmptyCols} />
                        Hide empty columns
                      </label>
                      <Label className="text-xs text-muted-foreground">Filter</Label>
                      <Select value={previewFilter} onValueChange={(v) => setPreviewFilter(v as any)}>
                        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All rows</SelectItem>
                          <SelectItem value="valid">Valid only</SelectItem>
                          <SelectItem value="warning">With warnings</SelectItem>
                          <SelectItem value="error">With errors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewExportRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No rows match this filter.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border max-h-[500px]">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium border-b w-16">Row</th>
                            <th className="px-2 py-2 text-left font-medium border-b w-24">Status</th>
                            {previewHeaders.map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewExportRows.map(({ row, product }, i) => {
                            const hasErr = product.validationErrors.some((e) => e.severity === "error");
                            const hasWarn = product.validationErrors.some((e) => e.severity === "warning");
                            return (
                              <tr key={i} className="border-b last:border-0">
                                <td className="px-2 py-1.5 text-muted-foreground border-b">{product.sourceRowId}</td>
                                <td className="px-2 py-1.5 border-b">
                                  {hasErr ? <Badge variant="destructive" className="text-[10px] h-4">error</Badge>
                                    : hasWarn ? <Badge className="text-[10px] h-4 bg-amber-500 hover:bg-amber-500 text-white">warn</Badge>
                                    : <Badge variant="secondary" className="text-[10px] h-4">ok</Badge>}
                                </td>
                                {previewHeaders.map((h) => (
                                  <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[240px] truncate border-b">
                                    {String(row[h] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      {/* Sticky footer — only after upload */}
      {hasFile && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="text-xs text-muted-foreground min-w-0 truncate">
              <span className="font-medium text-foreground">{summary.exportableRows}</span> ready ·{" "}
              <span className="font-medium text-foreground">{summary.blockedRows}</span> blocked ·{" "}
              <span className="font-medium text-foreground">{TARGET_META[target].title}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap items-center justify-end">
              <div
                role="status"
                aria-live="polite"
                data-testid="copy-mapping-status"
                className={
                  copyStatus
                    ? copyStatus.type === "success"
                      ? "inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                      : "inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                    : "hidden"
                }
              >
                {copyStatus && (
                  <>
                    <span aria-hidden="true">{copyStatus.type === "success" ? "✓" : "⚠"}</span>
                    <span>{copyStatus.message}</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-8" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={handleCopyMapping} disabled={!mappings.length}>
                <Copy className="h-3.5 w-3.5 mr-1" />Copy Mapping JSON
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={handleValidationReport} disabled={!products.length}>
                <Download className="h-3.5 w-3.5 mr-1" />Validation Report
              </Button>
              <Button size="default" onClick={handleDownload} disabled={!exportRows.length} className="h-9 font-semibold">
                <Download className="h-4 w-4 mr-1.5" />
                {TARGET_META[target].ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({ number, title, active }: { number: number; title: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className={`grid place-items-center h-7 w-7 rounded-full text-xs font-semibold shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {number}
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function MappingRow({
  field, required, headers, mapping, sample, onUpdate, onTransform, onClear,
}: {
  field: keyof ProductRecord;
  required?: boolean;
  headers: string[];
  mapping: ColumnMapping | undefined;
  sample: string;
  onUpdate: (field: keyof ProductRecord, sourceColumn: string, transform?: TransformRule) => void;
  onTransform: (field: keyof ProductRecord, transform: TransformRule) => void;
  onClear: (field: keyof ProductRecord) => void;
}) {
  const notMapped = required && !mapping;
  return (
    <div className={`rounded-md border p-3 ${notMapped ? "border-red-200 bg-red-50/40" : "bg-card"}`}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{FIELD_LABELS[field] || field}</span>
            {required && (
              <Badge variant={notMapped ? "destructive" : "default"} className="text-[10px] py-0 h-4">Required</Badge>
            )}
            {notMapped && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          </div>
          {sample && (
            <p className="mt-1.5 text-xs truncate">
              <span className="text-muted-foreground">Preview:</span>{" "}
              <span className="font-mono font-medium text-foreground">{sample}</span>
            </p>
          )}
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground tracking-wide">Source column</Label>
          <Select
            value={mapping?.sourceColumn || NO_SOURCE}
            onValueChange={(v) => onUpdate(field, v)}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue placeholder="— not mapped —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SOURCE}>— not mapped —</SelectItem>
              {headers.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground tracking-wide">Transform</Label>
          <Select
            value={mapping?.transform || defaultTransformFor(field)}
            onValueChange={(v) => onTransform(field, v as TransformRule)}
            disabled={!mapping}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSFORM_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{TRANSFORM_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex md:justify-end">
          {mapping && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onClear(field)}
              aria-label={`Clear mapping for ${FIELD_LABELS[field] || field}`}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueGroup({
  title, description, tone, issues,
}: {
  title: string;
  description: string;
  tone: "error" | "warning";
  issues: { p: ProductRecord; e: ProductRecord["validationErrors"][number] }[];
}) {
  const toneClass = tone === "error"
    ? "border-red-200 bg-red-50/40"
    : "border-amber-200 bg-amber-50/40";
  const Icon = tone === "error" ? AlertCircle : AlertTriangle;
  const iconColor = tone === "error" ? "text-destructive" : "text-amber-600";
  return (
    <div className={`rounded-md border ${toneClass}`}>
      <div className="flex items-center justify-between gap-3 p-3 border-b">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <p className="font-medium text-sm">{title}</p>
          <Badge variant="secondary" className="text-[10px] h-4">{issues.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
      </div>
      <div className="max-h-[280px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-background/60 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium border-b w-14">Row</th>
              <th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">Field</th>
              <th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">SKU</th>
              <th className="px-3 py-2 text-left font-medium border-b">Message</th>
            </tr>
          </thead>
          <tbody>
            {issues.slice(0, 100).map(({ p, e }, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-1.5 text-muted-foreground">{p.sourceRowId}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{e.field}</td>
                <td className="px-3 py-1.5 font-mono whitespace-nowrap">{p.sku || <span className="text-muted-foreground italic">—</span>}</td>
                <td className="px-3 py-1.5">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length > 100 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Showing 100 of {issues.length} issues. Download the validation report to see all.</p>
        )}
      </div>
    </div>
  );
}
