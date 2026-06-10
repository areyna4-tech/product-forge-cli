import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Upload, FileText, Download, Copy, RotateCcw, AlertCircle, CheckCircle2,
  AlertTriangle, FileSpreadsheet, X, Sparkles, Settings as SettingsIcon,
} from "lucide-react";
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
      { title: "Product CSV Mapper" },
      { name: "description", content: "Clean, map, validate, and export product CSV files for Shopify, WooCommerce, or generic import. Runs entirely in your browser." },
      { property: "og:title", content: "Product CSV Mapper" },
      { property: "og:description", content: "Clean, map, validate, and export product CSV files for Shopify, WooCommerce, or generic import." },
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

const NO_SOURCE = "__none__";

function Index() {
  const [filename, setFilename] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [settings, setSettings] = useState<MapperSettings>(defaultSettings);
  const [target, setTarget] = useState<ExportTemplate>("generic");
  const [error, setError] = useState<string>("");
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "warning" | "error">("all");
  const [issueFilter, setIssueFilter] = useState<"all" | "error" | "warning" | "duplicate" | "missing" | "price" | "image">("all");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transform: (v) => (v == null ? "" : String(v)),
      complete: (results) => {
        const hdrs = (results.meta.fields || []).filter(Boolean);
        if (!hdrs.length) {
          setError("CSV has no headers. Make sure the first row contains column names.");
          return;
        }
        if (!results.data.length) {
          setError("CSV is empty. No data rows found.");
          return;
        }
        setError("");
        setFilename(name);
        setHeaders(hdrs);
        setSourceRows(results.data);
        setMappings(autoMapHeaders(hdrs));
        toast.success(`Loaded ${results.data.length} rows from ${name}`);
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
    setPreviewFilter("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Reset complete");
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
    const targetName = target === "shopify" ? "shopify-products" : target === "woocommerce" ? "woocommerce-products" : "products";
    downloadCsv(exportRows, `${targetName}.csv`);
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

  const handleCopyMapping = async () => {
    const data = buildMappingJson();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(data);
      toast.success("Mapping JSON copied.");
    } catch {
      downloadMappingJson();
      toast.message("Clipboard unavailable. Downloading mapping JSON instead.");
    }
  };

  const previewHeaders = previewExportRows.length
    ? Object.keys(previewExportRows[0].row)
    : [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster />
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Product CSV Mapper</h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                Clean, map, validate, and export product CSV files for Shopify, WooCommerce, or generic import.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">No account required</Badge>
              <Badge variant="secondary">Runs in browser</Badge>
              <Badge variant="secondary">Export-ready CSV</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6 pb-40">
        {/* Upload Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Upload CSV</CardTitle>
            <CardDescription>Drag and drop a CSV file or browse to select one.</CardDescription>
          </CardHeader>
          <CardContent>
            {!filename ? (
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
                <div className="mt-3 flex justify-center gap-2">
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    Browse file
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadSample}>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />Load Sample CSV
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-md border bg-card p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {sourceRows.length} rows · {headers.length} columns
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={reset}>
                  <X className="h-3.5 w-3.5 mr-1.5" />Reset upload
                </Button>
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {headers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Detected headers</p>
                <div className="flex flex-wrap gap-1.5">
                  {headers.map((h) => (
                    <Badge key={h} variant="outline" className="font-mono text-xs">{h}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source CSV Preview</CardTitle>
            <CardDescription>First 10 rows of your uploaded file.</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No file uploaded yet.</p>
            ) : (
              <>
              <p className="text-xs text-muted-foreground mb-2">Scroll horizontally to view all columns.</p>
              <div className="overflow-x-auto rounded-md border max-h-96">

                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground border-b w-12">#</th>
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sourceRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        {headers.map((h) => {
                          const v = row[h] ?? "";
                          return (
                            <td key={h} className={`px-3 py-1.5 whitespace-nowrap ${!v ? "bg-amber-50" : ""}`}>
                              {v || <span className="text-muted-foreground italic">empty</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Target */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Target</CardTitle>
            <CardDescription>Choose the destination platform format.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {([
                { id: "generic", title: "Generic Clean CSV", desc: "Clean normalized product file for general imports." },
                { id: "shopify", title: "Shopify Product CSV", desc: "Shopify-compatible product import structure." },
                { id: "woocommerce", title: "WooCommerce Product CSV", desc: "WooCommerce-compatible product import structure." },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id)}
                  className={`text-left rounded-lg border p-4 transition-all ${target === t.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-foreground/30"}`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="font-medium text-sm">{t.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mapping Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Column Mapping</CardTitle>
            <CardDescription>Map each destination field to a source column. Required fields must be mapped to export.</CardDescription>
          </CardHeader>
          <CardContent>
            {headers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Upload a CSV to begin mapping.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left font-medium py-2 pr-3">Destination Field</th>
                      <th className="text-left font-medium py-2 pr-3">Source Column</th>
                      <th className="text-left font-medium py-2 pr-3">Transform</th>
                      <th className="text-left font-medium py-2 pr-3">Sample Output</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_DEST_FIELDS.map((field) => {
                      const m = mappings.find((x) => x.destinationField === field);
                      const required = REQUIRED_FIELDS.includes(field);
                      const sample = sampleTransformed(field);
                      const notMapped = required && !m;
                      return (
                        <tr key={field} className="border-b last:border-0">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{FIELD_LABELS[field] || field}</span>
                              <Badge variant={required ? "default" : "secondary"} className="text-[10px] py-0 h-4">
                                {required ? "Required" : "Optional"}
                              </Badge>
                              {notMapped && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                            </div>
                          </td>
                          <td className="py-2 pr-3 min-w-[180px]">
                            <Select
                              value={m?.sourceColumn || NO_SOURCE}
                              onValueChange={(v) => updateMapping(field, v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="— not mapped —" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_SOURCE}>— not mapped —</SelectItem>
                                {headers.map((h) => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 pr-3 min-w-[150px]">
                            <Select
                              value={m?.transform || defaultTransformFor(field)}
                              onValueChange={(v) => updateTransform(field, v as TransformRule)}
                              disabled={!m}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRANSFORM_OPTIONS.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                            {sample || <span className="italic">—</span>}
                          </td>
                          <td className="py-2">
                            {m && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => clearMapping(field)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="h-4 w-4" />Global Transform Settings</CardTitle>
            <CardDescription>Defaults applied during transformation.</CardDescription>
          </CardHeader>
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
        </Card>

        {/* Validation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation Summary</CardTitle>
            <CardDescription>Quality overview of transformed product records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <StatCard label="Total rows" value={summary.totalRows} />
              <StatCard label="Exportable rows" value={summary.exportableRows} tone={summary.exportableRows ? "good" : "neutral"} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
              <StatCard label="Blocked rows" value={summary.blockedRows} tone={summary.blockedRows ? "bad" : "neutral"} icon={<AlertCircle className="h-3.5 w-3.5" />} />
              <StatCard label="Rows with warnings" value={summary.warningRows} tone={summary.warningRows ? "warn" : "neutral"} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
              <StatCard label="Duplicate SKU issues" value={summary.duplicateSkuIssues} tone={summary.duplicateSkuIssues ? "warn" : "neutral"} />
              <StatCard label="Missing required fields" value={summary.missingRequiredIssues} tone={summary.missingRequiredIssues ? "bad" : "neutral"} />
              <StatCard label="Invalid price fields" value={summary.invalidPriceIssues} tone={summary.invalidPriceIssues ? "bad" : "neutral"} />
              <StatCard label="Invalid image URL fields" value={summary.invalidImageUrlIssues} tone={summary.invalidImageUrlIssues ? "warn" : "neutral"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Exportable rows have no error-level issues. Warning-only rows are exportable. Field issue cards count individual issue instances.
            </p>
          </CardContent>
        </Card>

        {/* Issue Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">Issue Details</CardTitle>
                <CardDescription>Every validation issue found in your data.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Filter</Label>
                <Select value={issueFilter} onValueChange={(v) => setIssueFilter(v as any)}>
                  <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="duplicate">Duplicate SKU</SelectItem>
                    <SelectItem value="missing">Missing Required</SelectItem>
                    <SelectItem value="price">Invalid Price</SelectItem>
                    <SelectItem value="image">Invalid Image URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const issues: { p: ProductRecord; e: typeof products[number]["validationErrors"][number] }[] = [];
              for (const p of products) for (const e of p.validationErrors) issues.push({ p, e });
              const filtered = issues.filter(({ e }) => {
                switch (issueFilter) {
                  case "all": return true;
                  case "error": return e.severity === "error";
                  case "warning": return e.severity === "warning";
                  case "duplicate": return e.message === "Duplicate SKU";
                  case "missing": return e.severity === "error" && (e.field === "title" || e.field === "sku" || e.field === "price");
                  case "price": return e.severity === "error" && e.field === "price";
                  case "image": return e.severity === "warning" && e.field === "imageUrl";
                }
              });
              if (!products.length) return <p className="text-sm text-muted-foreground py-8 text-center">Upload and map data to see issues.</p>;
              if (!filtered.length) return <p className="text-sm text-muted-foreground py-8 text-center">No issues match this filter.</p>;
              return (
                <>
                  <p className="text-xs text-muted-foreground mb-2">Scroll horizontally to view all columns.</p>
                  <div className="overflow-x-auto rounded-md border max-h-[400px]">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium border-b w-14">Row</th>
                          <th className="px-2 py-2 text-left font-medium border-b w-24">Severity</th>
                          <th className="px-2 py-2 text-left font-medium border-b whitespace-nowrap">Field</th>
                          <th className="px-2 py-2 text-left font-medium border-b whitespace-nowrap">SKU</th>
                          <th className="px-2 py-2 text-left font-medium border-b whitespace-nowrap">Title</th>
                          <th className="px-2 py-2 text-left font-medium border-b whitespace-nowrap">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(({ p, e }, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-2 py-1.5 text-muted-foreground">{p.sourceRowId}</td>
                            <td className="px-2 py-1.5">
                              {e.severity === "error"
                                ? <Badge variant="destructive" className="text-[10px] h-4">error</Badge>
                                : <Badge className="text-[10px] h-4 bg-amber-500 hover:bg-amber-500 text-white">warning</Badge>}
                            </td>
                            <td className="px-2 py-1.5 font-mono whitespace-nowrap">{e.field}</td>
                            <td className="px-2 py-1.5 font-mono whitespace-nowrap">{p.sku || <span className="text-muted-foreground italic">—</span>}</td>
                            <td className="px-2 py-1.5 whitespace-nowrap max-w-[240px] truncate">{p.title || <span className="text-muted-foreground italic">—</span>}</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>



        {/* Output Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">Output Preview</CardTitle>
                <CardDescription>First 25 transformed rows for {target}.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
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
              <p className="text-sm text-muted-foreground py-8 text-center">
                {products.length === 0 ? "Upload data and map fields to preview output." : "No rows match this filter."}
              </p>
            ) : (
              <div className="overflow-auto rounded-md border max-h-[500px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
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
                          <td className="px-2 py-1.5 text-muted-foreground">{product.sourceRowId}</td>
                          <td className="px-2 py-1.5">
                            {hasErr ? <Badge variant="destructive" className="text-[10px] h-4">error</Badge>
                              : hasWarn ? <Badge className="text-[10px] h-4 bg-amber-500 hover:bg-amber-500">warn</Badge>
                              : <Badge variant="secondary" className="text-[10px] h-4">ok</Badge>}
                          </td>
                          {previewHeaders.map((h) => (
                            <td key={h} className="px-3 py-1.5 whitespace-nowrap max-w-[240px] truncate">
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
      </main>

      {/* Sticky Export Actions */}
      <div className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur z-10">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground space-y-0.5">
            {products.length > 0 ? (
              <>
                <div>
                  Ready to export <span className="font-medium text-foreground">{summary.exportableRows} {summary.exportableRows === 1 ? "exportable row" : "exportable rows"}</span>.{" "}
                  <span className="font-medium text-foreground">{summary.blockedRows} {summary.blockedRows === 1 ? "row" : "rows"}</span> blocked by errors.
                </div>
                <div>Exports exclude error rows and include warning rows.</div>
              </>
            ) : (
              "Map required fields and upload data to enable export."
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyMapping} disabled={!mappings.length}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />Copy Mapping JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleValidationReport} disabled={!products.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Validation Report
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!exportRows.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Download CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, tone = "neutral", icon,
}: { label: string; value: number; tone?: "good" | "warn" | "bad" | "neutral"; icon?: React.ReactNode }) {
  const toneClass =
    tone === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : tone === "warn" ? "bg-amber-50 text-amber-700 border-amber-200"
    : tone === "bad" ? "bg-red-50 text-red-700 border-red-200"
    : "bg-card";
  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
