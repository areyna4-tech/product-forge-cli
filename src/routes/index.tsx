import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { track } from "@/lib/analytics";
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
      { title: "Shopify CSV Pre-Flight Checker & Converter" },
      { name: "description", content: "Find import blockers in messy supplier product CSVs, fix field mappings, and export a Shopify-ready file before upload." },
      { property: "og:title", content: "Shopify CSV Pre-Flight Checker & Converter" },
      { property: "og:description", content: "Find import blockers in messy supplier product CSVs, fix field mappings, and export a Shopify-ready file before upload." },
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
  shopify: { title: "Shopify Product CSV", desc: "Shopify-compatible product import structure with required fields pre-mapped.", ctaLabel: "Download Shopify CSV", filename: "shopify-products.csv" },
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

type IssueInfo = {
  problem: string;
  current: string;
  expected: string;
  fix: string;
  shortIssue: string;
  sourceColumn: string;
  cellRef: string;
};

function columnIndexToLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function describeIssue(
  p: ProductRecord,
  e: ProductRecord["validationErrors"][number],
  mappings: ColumnMapping[],
  headers: string[],
): IssueInfo {
  const m = mappings.find((x) => x.destinationField === e.field);
  const sourceColumn = m?.sourceColumn ?? "";
  const raw = m ? (p.rawSource[m.sourceColumn] ?? "") : "";
  const fieldVal = (p as any)[e.field];
  const currentRaw = raw !== "" ? raw : (fieldVal == null || fieldVal === "" ? "" : String(fieldVal));
  const colIdx = sourceColumn ? headers.indexOf(sourceColumn) : -1;
  // Spreadsheet row = data row + 1 (header occupies row 1)
  const cellRef = colIdx >= 0 ? `${columnIndexToLetter(colIdx)}${p.sourceRowId + 1}` : "";

  const base = { current: currentRaw, sourceColumn, cellRef };

  if (e.field === "title" && e.message === "Title is required") {
    return { ...base, shortIssue: "Missing required value", problem: "Required field is missing.", expected: "Product title", fix: "Add a product title before import." };
  }
  if (e.field === "sku" && e.message === "SKU is required") {
    return { ...base, shortIssue: "Missing required value", problem: "Required field is missing.", expected: "A unique product code like ABC-123", fix: "Add a unique SKU before import." };
  }
  if (e.field === "sku" && e.message === "Duplicate SKU") {
    return { ...base, shortIssue: "Duplicate SKU detected", problem: "SKU is used by more than one row.", expected: "A unique SKU per row", fix: "Confirm whether this is a variant or assign a unique SKU." };
  }
  if (e.field === "price" && e.message === "Price is invalid or missing") {
    return { ...base, shortIssue: "Invalid price format", problem: "Price is not a valid number.", expected: "A number like 29.99", fix: "Convert to a numeric value (for example, 44,95 → 44.95) before export." };
  }
  if (e.field === "price" && e.message === "Price is zero or negative") {
    return { ...base, shortIssue: "Price is zero or negative", problem: "Price is zero or negative.", expected: "A positive number like 29.99", fix: "Set a positive price greater than zero." };
  }
  if (e.field === "compareAtPrice") {
    return { ...base, shortIssue: "Compare-at price lower than price", problem: "Compare-at price is lower than price.", expected: "A value higher than the price, or leave it blank", fix: "Increase the compare-at price or remove it." };
  }
  if (e.field === "cost") {
    return { ...base, shortIssue: "Cost exceeds price", problem: "Cost is higher than the price.", expected: "A cost lower than the price", fix: "Lower the cost or raise the price." };
  }
  if (e.field === "quantity") {
    return { ...base, shortIssue: "Negative quantity", problem: "Quantity is negative.", expected: "Zero or a positive whole number", fix: "Set quantity to 0 or higher." };
  }
  if (e.field === "imageUrl") {
    return { ...base, shortIssue: "Invalid image URL", problem: "Image URL may not be valid.", expected: "A full URL starting with https://", fix: "Use a full https:// image URL." };
  }
  if (e.field === "barcode") {
    return { ...base, shortIssue: "Barcode contains letters", problem: "Barcode contains letters.", expected: "Digits only (UPC, EAN, or GTIN)", fix: "Remove letters so only digits remain." };
  }
  return { ...base, shortIssue: e.message, problem: e.message, expected: "Valid value for this field", fix: "Update the value in the source CSV and re-upload." };
}

function Index() {
  const [filename, setFilename] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [settings, setSettings] = useState<MapperSettings>(defaultSettings);
  const [target, setTarget] = useState<ExportTemplate>("shopify");
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [worthChoice, setWorthChoice] = useState<"yes" | "maybe" | "no" | null>(null);
  const [solvedChoice, setSolvedChoice] = useState<"yes" | "partially" | "no" | null>(null);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyStatusTimeoutRef = useRef<number | null>(null);

  // Track landing view once on mount.
  useEffect(() => { track("landing_page_view"); }, []);





  const hasFile = sourceRows.length > 0;

  const products = useMemo(() => {
    if (!sourceRows.length) return [];
    return validateProducts(transformRows(sourceRows, mappings, settings), settings);
  }, [sourceRows, mappings, settings]);

  const summary = useMemo(() => summarize(products), [products]);

  // Fire validation events when results change.
  useEffect(() => {
    if (!products.length) return;
    track("validation_completed", {
      total: products.length,
      exportable: summary.exportableRows,
      blocked: summary.blockedRows,
      warnings: summary.warningRows,
    });
    if (summary.blockedRows > 0) track("blocker_found", { count: summary.blockedRows });
    if (summary.warningRows > 0) track("warning_found", { count: summary.warningRows });
  }, [products, summary.exportableRows, summary.blockedRows, summary.warningRows]);

  const exportRows = useMemo(() => {
    const valid = products.filter((p) => !p.validationErrors.some((e) => e.severity === "error"));
    if (target === "shopify") return buildShopifyRows(valid);
    if (target === "woocommerce") return buildWooCommerceRows(valid);
    return buildGenericRows(valid);
  }, [products, target]);

  const previewExportRows = useMemo(() => {
    let filtered = products;
    if (previewFilter === "exportable") filtered = products.filter((p) => !p.validationErrors.some((e) => e.severity === "error"));
    else if (previewFilter === "warning") filtered = products.filter((p) => p.validationErrors.some((e) => e.severity === "warning") && !p.validationErrors.some((e) => e.severity === "error"));
    else if (previewFilter === "error") filtered = products.filter((p) => p.validationErrors.some((e) => e.severity === "error"));
    const rows = target === "shopify" ? buildShopifyRows(filtered)
      : target === "woocommerce" ? buildWooCommerceRows(filtered)
      : buildGenericRows(filtered);
    return rows.slice(0, 25).map((r, i) => ({ row: r, product: filtered[i] }));
  }, [products, target, previewFilter]);

  // Fire once whenever the preview becomes available for a new file.
  useEffect(() => {
    if (previewExportRows.length > 0) {
      track("output_preview_viewed", { target, rows: previewExportRows.length });
    }
  }, [target, previewExportRows.length]);

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
        track("csv_uploaded", { rows: rows.length, columns: hdrs.length, filename: name });
        toast.success(`Loaded ${rows.length} rows from ${name}`);
      },
      error: (err: Error) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setError("We could not read this file. Upload a valid .csv file with a header row.");
      return;

    }
    const reader = new FileReader();
    reader.onload = () => parseCsvText(String(reader.result || ""), file.name);
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }, [parseCsvText]);

  const loadSample = () => {
    track("sample_file_loaded");
    parseCsvText(SAMPLE_CSV, "sample-products.csv");
  };

  const reset = () => {
    setFilename(""); setHeaders([]); setSourceRows([]); setMappings([]);
    setSettings(defaultSettings); setTarget("shopify"); setError("");
    setPreviewFilter("exportable"); setIssueFilter("all"); setHowToFixOpen(false);
    setOptionalOpen(false); setAdvancedOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Reset complete");
  };

  const replaceFile = () => {
    fileInputRef.current?.click();
  };

  const updateMapping = (field: keyof ProductRecord, sourceColumn: string, transform?: TransformRule) => {
    track("mapping_changed", { field, sourceColumn: sourceColumn === NO_SOURCE ? null : sourceColumn });
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
    track("mapping_changed", { field, transform });
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

  const performDownload = () => {
    downloadCsv(exportRows, TARGET_META[target].filename);
    toast.success(`Exported ${exportRows.length} rows`);
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
    if (freeExportUsed) {
      track("free_export_limit_reached", { target, rows: exportRows.length });
      setLimitEmail("");
      setLimitSubmitted(false);
      setLimitModalOpen(true);
      return;
    }
    track("export_clicked", { target, rows: exportRows.length });
    track("free_beta_export_used", { target, rows: exportRows.length });
    try { window.localStorage.setItem("csv_free_export_used", "1"); } catch { /* ignore */ }
    setFreeExportUsed(true);
    performDownload();
    setFeedbackSubmitted(false);
    setFeedbackChoice(null);
    setFeedbackNote("");
    setFeedbackOpen(true);
  };

  const handleLimitInterest = (intent: "yes" | "maybe") => {
    track("paid_beta_interest_clicked", { intent, email: limitEmail || null });
    if (intent === "yes" && limitEmail) {
      track("email_submitted_after_limit", { email: limitEmail });
    }
    setLimitSubmitted(true);
  };

  const submitFeedback = () => {
    track("feedback_submitted", { choice: feedbackChoice, note: feedbackNote || null });
    setFeedbackSubmitted(true);
  };


  const handleValidationReport = () => {
    const rows: Record<string, any>[] = [];
    for (const p of products) {
      for (const e of p.validationErrors) {
        const d = describeIssue(p, e, mappings, headers);
        rows.push({
          row: p.sourceRowId,
          sku: p.sku,
          title: p.title,
          field: FIELD_LABELS[e.field] || e.field,
          sourceColumn: d.sourceColumn,
          cell: d.cellRef,
          severity: e.severity === "error" ? "Blocked" : "Warning",
          problem: d.problem,
          currentValue: d.current,
          expectedFormat: d.expected,
          suggestedFix: d.fix,
        });
      }
    }
    if (!rows.length) { toast.info("No validation issues to report."); return; }
    track("validation_report_downloaded", { issues: rows.length });
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
    a.href = url; a.download = "mapping-template.json"; a.click();
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
      track("mapping_template_copied");
      setCopyStatus({ type: "success", message: "Mapping template copied." });
      toast.success("Mapping template copied.");
    } else {
      downloadMappingJson();
      setCopyStatus({ type: "warning", message: "Clipboard unavailable. Downloading mapping template instead." });
      toast.warning("Clipboard unavailable. Downloading mapping template instead.", { duration: 4000 });
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
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" duration={3500} richColors closeButton offset={16} />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Shopify CSV Pre-Flight Checker &amp; Converter
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Find import blockers in messy supplier product CSVs, fix field mappings, and export a Shopify-ready file before upload.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: Check, label: "No signup required" },
              { icon: Shield, label: "Runs locally in your browser" },
              { icon: FileSpreadsheet, label: "Import-ready export" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80"
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-6">

        {/* Landing hero — public-facing intro shown until a file is uploaded */}
        {!hasFile && (
          <section aria-labelledby="landing-headline" className="space-y-6">
            <div className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
              <h2
                id="landing-headline"
                className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground"
              >
                Fix Shopify product CSV import errors before upload.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Upload a messy supplier product CSV, find blockers, fix field mappings, and export a Shopify-ready file.
              </p>
              <div className="mt-5 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => {
                    track("check_csv_cta_clicked");
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Check my CSV free
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                No signup required. Runs locally in your browser. Import-ready export.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ol className="space-y-2 list-decimal pl-4">
                    <li>Upload your supplier CSV</li>
                    <li>Review blockers and warnings</li>
                    <li>Export a Shopify-ready CSV</li>
                  </ol>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">What this checks</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>Missing titles</li>
                    <li>Missing SKUs</li>
                    <li>Invalid prices</li>
                    <li>Duplicate SKUs or handles</li>
                    <li>Image URL format issues</li>
                    <li>Required Shopify fields</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p className="text-foreground font-medium">Free scan available now.</p>
                  <p>Fixed Shopify-ready export is in beta.</p>
                  <p className="text-xs">Target price: $9 per export.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Step 1 — Upload */}
        <section>
          <StepHeader number={1} title="Upload supplier product CSV" active />
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
                    <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                      Upload a CSV with product names, SKUs, prices, inventory, images, or variants.
                    </p>
                    <div className="mt-4 flex justify-center gap-2 flex-wrap">
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1.5" />Browse CSV file
                      </Button>
                      <Button variant="outline" onClick={loadSample}>
                        <Sparkles className="h-4 w-4 mr-1.5" />Try sample file
                      </Button>
                    </div>

                  </div>

                  {/* Prototype notice */}
                  <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    <strong>Prototype notice:</strong> Please do not upload sensitive or confidential product data during testing. Use a non-sensitive CSV or the provided sample file.
                  </p>

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
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={replaceFile}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />Replace file
                    </Button>
                    <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset
                    </Button>
                  </div>
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
              <StepHeader number={2} title="Choose target import format" active />
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-3 md:grid-cols-3">
                    {(["shopify", "woocommerce", "generic"] as const).map((id) => {
                      const t = TARGET_META[id];
                      const selected = target === id;
                      return (
                        <button
                          key={id}
                          onClick={() => { setTarget(id); track("target_format_selected", { target: id }); }}
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
              <StepHeader number={3} title="Review import field mapping" active />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Required fields</CardTitle>
                  <CardDescription>
                    {allRequiredMapped
                      ? `${requiredMappedCount} of ${REQUIRED_FIELDS.length} required fields mapped.`
                      : `${requiredMappedCount} of ${REQUIRED_FIELDS.length} required fields mapped. Map all required fields before export.`}
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

              <Card className="mt-4">
                <details
                  open={optionalOpen}
                  onToggle={(e) => setOptionalOpen((e.target as HTMLDetailsElement).open)}
                  className="group"
                >
                  <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                            Optional fields
                          </CardTitle>
                          <CardDescription>
                            {(() => {
                              const mappedCount = mappings.filter((m) => !REQUIRED_FIELDS.includes(m.destinationField)).length;
                              const unmappedCount = optionalFields.length - mappedCount;
                              return `${mappedCount} mapped · ${unmappedCount} unmapped · images, variants, inventory, SEO`;
                            })()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </summary>
                  <CardContent className="space-y-6">
                    {OPTIONAL_GROUPS.map((group) => {
                      const groupMapped = group.fields.filter((f) => mappings.some((m) => m.destinationField === f)).length;
                      return (
                        <div key={group.title}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
                            <span className="text-[10px] text-muted-foreground">{groupMapped}/{group.fields.length} mapped</span>
                          </div>
                          <div className="space-y-3">
                            {group.fields.map((field) => (
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
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </details>
              </Card>

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

              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Copy this supplier mapping so you can save it and reuse it with similar CSVs later.
                </p>
                <div className="flex items-center gap-2">
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
                  <Button variant="outline" size="sm" onClick={handleCopyMapping} disabled={!mappings.length}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />Copy mapping template
                  </Button>
                </div>
              </div>
            </section>

            {/* Step 4 — Validate & export */}
            <section>
              <StepHeader number={4} title="Pre-flight check & export" active />

              {/* What this checks */}
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">What this checks</p>
                  <ul className="grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground list-disc pl-4">
                    <li>Required field mappings</li>
                    <li>Price formatting</li>
                    <li>Exportable rows</li>
                    <li>Blocked rows</li>
                    <li>Target CSV structure</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Validation — only show when issues exist */}
              {(blockingIssues.length > 0 || warningIssues.length > 0) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <CardTitle className="text-base">Import blockers found</CardTitle>
                          <CardDescription>
                            {summary.blockedRows} rows blocked · {summary.warningRows} rows with warnings
                          </CardDescription>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {summary.blockedRows > 0
                              ? "Blocked rows will be excluded from the import file. Fix them in the source CSV and re-upload."
                              : "All rows are import-ready. Warning rows are included."}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleValidationReport} disabled={!products.length} className="shrink-0">
                        <Download className="h-3.5 w-3.5 mr-1.5" />Download validation report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* How to fix helper — native details for reliability */}
                    <details
                      className="rounded-md border bg-muted/30 group"
                      open={howToFixOpen}
                      onToggle={(e) => setHowToFixOpen((e.target as HTMLDetailsElement).open)}
                    >
                      <summary className="flex items-center justify-between gap-2 p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">How to fix issues</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                      </summary>
                      <ol className="px-3 pb-3 pl-10 list-decimal text-sm text-muted-foreground space-y-1">
                        <li>Open your original CSV in Excel, Google Sheets, or your spreadsheet tool.</li>
                        <li>Find the row number shown in each issue below.</li>
                        <li>Update the field using the suggested fix.</li>
                        <li>Save the CSV and re-upload it here.</li>
                      </ol>
                    </details>

                    {/* What this checks */}
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">What this checks</p>
                      <ul className="grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground list-disc pl-4">
                        <li>Missing titles</li>
                        <li>Missing SKUs</li>
                        <li>Invalid prices</li>
                        <li>Duplicate SKUs or handles</li>
                        <li>Image URL issues</li>
                        <li>Required import fields</li>
                      </ul>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                      {([
                        ["all", `All issues (${blockingIssues.length + warningIssues.length})`],
                        ["blocking", `Blocking only (${blockingIssues.length})`],
                        ["warnings", `Warnings only (${warningIssues.length})`],
                      ] as const).map(([id, label]) => {
                        const active = issueFilter === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setIssueFilter(id)}
                            aria-pressed={active}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${active ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm" : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {(issueFilter === "all" || issueFilter === "blocking") && blockingIssues.length > 0 && (
                      <IssueGroup
                        title="Blocking errors"
                        description="These rows will be excluded from the import file. Fix them in the source CSV and re-upload."
                        tone="error"
                        issues={blockingIssues}
                        mappings={mappings}
                        headers={headers}
                      />
                    )}
                    {(issueFilter === "all" || issueFilter === "warnings") && warningIssues.length > 0 && (
                      <IssueGroup
                        title="Warnings"
                        description="These rows can still be imported, but may cause issues in Shopify."
                        tone="warning"
                        issues={warningIssues}
                        mappings={mappings}
                        headers={headers}
                      />
                    )}
                    {issueFilter === "blocking" && blockingIssues.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No blocking import errors.</p>
                    )}
                    {issueFilter === "warnings" && warningIssues.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No warnings.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Export readiness */}
              <Card className="mt-4">
                <CardContent className="pt-6">
                  {allRequiredMapped && summary.exportableRows > 0 ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {summary.blockedRows > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                          <p className="font-medium">
                            {summary.blockedRows > 0 ? "Import blockers found. Review required fields before exporting." : "Ready for import"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {summary.exportableRows} rows validated · {summary.blockedRows} blocked · {TARGET_META[target].title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {summary.blockedRows > 0
                            ? "Blocked rows will be excluded from the import file. Fix them in the source CSV and re-upload."
                            : target === "shopify"
                              ? "No import blockers found for required Shopify fields."
                              : target === "woocommerce"
                                ? "No import blockers found for required WooCommerce fields."
                                : "No blockers found for required clean product fields."}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {freeExportUsed ? (
                          <>
                            <Button onClick={handleDownload} size="lg" variant="outline" className="font-semibold">
                              You’ve used your free beta export
                            </Button>
                            <span className="text-[11px] text-muted-foreground">Request more exports — $9/file target price</span>
                          </>
                        ) : (
                          <>
                            <Button onClick={handleDownload} size="lg" className="font-semibold">
                              <Download className="h-4 w-4 mr-1.5" />
                              Download free beta export
                            </Button>
                            <span className="text-[11px] text-muted-foreground">1 free export per browser during beta</span>
                          </>
                        )}
                      </div>


                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Not ready for import</p>
                        <p className="text-muted-foreground">
                          {!allRequiredMapped
                            ? "Required fields need mapping before export."
                            : "No importable rows yet — every row has a blocking error."}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output Preview */}
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <CardTitle className="text-base">Output preview</CardTitle>
                      <CardDescription>Preview the first 25 rows exactly as they will appear in the exported import file.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Label className="text-xs text-muted-foreground">Show</Label>
                      <Select value={previewFilter} onValueChange={(v) => setPreviewFilter(v as any)}>
                        <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exportable">Exportable rows</SelectItem>
                          <SelectItem value="all">All rows</SelectItem>
                          <SelectItem value="warning">With warnings</SelectItem>
                          <SelectItem value="error">Blocked rows</SelectItem>
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Switch checked={hideEmptyCols} onCheckedChange={setHideEmptyCols} />
                        Hide empty columns
                      </label>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Previewing first 25 rows. Download includes all exportable rows. Scroll to review all columns.
                  </p>

                </CardHeader>
                <CardContent>
                  {previewExportRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No rows match this filter.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border max-h-[500px]">
                      <table className="w-full text-xs">
                        <thead className="bg-[#f8fafc] sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium border-b w-16 text-muted-foreground">Row</th>
                            <th className="px-2 py-2 text-left font-medium border-b w-24 text-muted-foreground">Status</th>
                            {previewHeaders.map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewExportRows.map(({ row, product }, i) => {
                            const hasErr = product.validationErrors.some((e) => e.severity === "error");
                            const hasWarn = product.validationErrors.some((e) => e.severity === "warning");
                            return (
                              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="px-2 py-1.5 text-muted-foreground border-b">{product.sourceRowId}</td>
                                <td className="px-2 py-1.5 border-b">
                                  {hasErr ? (
                                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 border border-red-200">Must fix before import</span>
                                  ) : hasWarn ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">Review recommended</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">Exportable</span>
                                  )}
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

      {/* Free-export limit modal */}
      <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You’ve used your free beta export</DialogTitle>
            <DialogDescription>
              We’re validating paid exports at $9/file. Want to be notified when more exports are available?
            </DialogDescription>
          </DialogHeader>

          {!limitSubmitted ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="limit-email" className="text-xs">Email optional</Label>
                <Input
                  id="limit-email"
                  type="email"
                  placeholder="you@store.com"
                  value={limitEmail}
                  onChange={(e) => setLimitEmail(e.target.value)}
                />
              </div>
              <DialogFooter className="sm:justify-end gap-2">
                <Button variant="ghost" onClick={() => handleLimitInterest("maybe")}>Maybe later</Button>
                <Button onClick={() => handleLimitInterest("yes")}>Yes, notify me</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">
                Thanks{limitEmail ? ` — we saved ${limitEmail}` : ""}. We’ll be in touch when more exports are available.
              </p>
              <DialogFooter>
                <Button onClick={() => setLimitModalOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Post-export feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Would this fixed Shopify-ready export be worth $9/file if it worked reliably on your real CSVs?</DialogTitle>
            <DialogDescription>Quick feedback helps us improve the checks.</DialogDescription>
          </DialogHeader>

          {!feedbackSubmitted ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["yes", "maybe", "no"] as const).map((c) => (

                  <Button
                    key={c}
                    variant={feedbackChoice === c ? "default" : "outline"}
                    onClick={() => setFeedbackChoice(c)}
                    className="capitalize"
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feedback-note" className="text-xs">What was missing? (optional)</Label>
                <Input
                  id="feedback-note"
                  placeholder="Anything that didn't work or felt off"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Skip</Button>
                <Button onClick={submitFeedback} disabled={!feedbackChoice}>Send feedback</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">Thanks for the feedback.</p>
              <DialogFooter>
                <Button onClick={() => setFeedbackOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const fieldLabel = FIELD_LABELS[field] || field;
  return (
    <div className={`rounded-md border p-3 ${notMapped ? "border-red-300 bg-red-50/60 border-l-4 border-l-red-500" : required ? "bg-card border-l-4 border-l-primary" : "bg-card"}`}>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{fieldLabel}</span>
            {required && (
              <Badge variant={notMapped ? "destructive" : "default"} className="text-[10px] py-0 h-4">Required</Badge>
            )}
            {notMapped && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          </div>
          {notMapped && (
            <p className="mt-1.5 text-xs text-red-700">
              {fieldLabel} is required. Choose a source column before exporting.
            </p>
          )}
          {sample && !notMapped && (
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
              <SelectValue placeholder="Select source column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SOURCE}>Select source column</SelectItem>
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
  title, description, tone, issues, mappings, headers,
}: {
  title: string;
  description: string;
  tone: "error" | "warning";
  issues: { p: ProductRecord; e: ProductRecord["validationErrors"][number] }[];
  mappings: ColumnMapping[];
  headers: string[];
}) {
  const Icon = tone === "error" ? AlertCircle : AlertTriangle;
  const iconColor = tone === "error" ? "text-destructive" : "text-amber-600";
  const badgeLabel = tone === "error" ? "Blocked" : "Warning";
  const badgeClass = tone === "error"
    ? "bg-destructive text-destructive-foreground"
    : "bg-amber-500 text-white";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <p className="font-medium text-sm">{title}</p>
        <Badge variant="secondary" className="text-[10px] h-4">{issues.length}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="space-y-2">
        {issues.slice(0, 100).map(({ p, e }, i) => {
          const d = describeIssue(p, e, mappings, headers);
          const fieldLabel = FIELD_LABELS[e.field] || e.field;
          const sourceLine = d.sourceColumn
            ? `Source: ${d.sourceColumn}${d.cellRef ? `, Cell ${d.cellRef}` : ""}`
            : "Source: not mapped";
          return (
            <div key={i} className="rounded-md border bg-card p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                  {badgeLabel}
                </span>
                <span className="text-sm font-medium">
                  Row {p.sourceRowId} · {fieldLabel} · {d.shortIssue}
                </span>
                {p.sku && (
                  <span className="text-xs text-muted-foreground font-mono">SKU: {p.sku}</span>
                )}
              </div>
              <dl className="space-y-1 text-xs sm:text-sm">
                <div className="text-muted-foreground">{sourceLine}</div>
                <div>
                  <span className="text-muted-foreground">Value: </span>
                  {d.current ? (
                    <span className="font-mono text-foreground break-all">{d.current}</span>
                  ) : (
                    <span className="italic text-muted-foreground">blank</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Suggested fix: </span>
                  <span className="text-foreground">{d.fix}</span>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
      {issues.length > 100 && (
        <p className="text-xs text-muted-foreground">
          Showing 100 of {issues.length} issues. Download the validation report to see all.
        </p>
      )}
    </div>
  );
}
