import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Shield, Check, FileSpreadsheet, ArrowRightLeft, AlertTriangle, Download, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/supplier-csv-to-shopify")({
  head: () => ({
    meta: [
      { title: "Supplier CSV to Shopify Checker | Product Forge" },
      { name: "description", content: "Convert supplier product spreadsheets into Shopify-ready CSVs. Map columns, validate data, block bad rows, and export a clean file for Shopify import." },
      { property: "og:title", content: "Supplier CSV to Shopify Checker | Product Forge" },
      { property: "og:description", content: "Convert supplier product spreadsheets into Shopify-ready CSVs. Map columns, validate data, block bad rows, and export a clean file for Shopify import." },
      { property: "og:url", content: "https://productcsvfixer.com/supplier-csv-to-shopify" } ,
    ],
    links: [{ rel: "canonical", href: "https://productcsvfixer.com/supplier-csv-to-shopify" }],
  }),
  component: SupplierCsvToShopifyPage,
});

function SupplierCsvToShopifyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          <div className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            Product Forge
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Shopify CSV Pre-Flight Checker &amp; Converter
          </p>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Find import blockers in messy supplier product CSVs, fix field mappings, and export a Shopify-ready file before upload.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-6">
        {/* Hero */}
        <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Convert supplier product CSVs into Shopify-ready files
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Supplier spreadsheets use their own column names and formats. Map them to Shopify fields, validate every row, and export a clean CSV that imports without errors.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "supplier-csv-to-shopify" })}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my CSV free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No signup required. Runs locally in your browser. Import-ready export.
          </p>
        </section>

        {/* Problem */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            The supplier-to-Shopify gap
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Suppliers deliver product data in spreadsheets with custom headers, mixed currencies, and missing fields. Shopify expects a specific CSV format. ProductCSVFixer bridges that gap by mapping supplier columns to Shopify fields, validating the data, blocking bad rows, and producing a Shopify-compatible export.
          </p>
        </section>

        {/* Steps */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Factory,
              title: "Works with any supplier file",
              desc: "Accepts CSVs from wholesalers, dropshippers, manufacturers, or marketplaces — no template required.",
            },
            {
              icon: ArrowRightLeft,
              title: "Smart column mapping",
              desc: "Auto-suggests mappings from supplier headers to Shopify fields. Review and edit before confirming.",
            },
            {
              icon: AlertTriangle,
              title: "Blocked rows explained",
              desc: "Rows with critical errors are excluded from export. You get a report showing exactly what to fix.",
            },
            {
              icon: FileSpreadsheet,
              title: "Field validation",
              desc: "Checks for missing titles, SKUs, prices, handles, and image URLs so nothing breaks in Shopify.",
            },
            {
              icon: Download,
              title: "Beta export",
              desc: "Download a Shopify-ready CSV with mapped fields and blocked rows removed. Ready for direct upload.",
            },
            {
              icon: Shield,
              title: "Browser-based processing",
              desc: "Your supplier data never leaves your device. All mapping and validation runs locally.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {desc}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* What it checks */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What we check before export
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { title: "Required fields", desc: "Title, handle, price, and SKU are verified. Missing values are flagged as errors." },
              { title: "Data quality", desc: "Invalid prices, broken image URLs, duplicate SKUs, and malformed handles are caught early." },
              { title: "Row health", desc: "Clean rows pass through. Blocked rows are excluded so your Shopify import succeeds." },
            ].map((s) => (
              <Card key={s.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.desc}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Convert your supplier CSV to Shopify now
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Upload, map, validate, and export — all in your browser. No signup needed.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "supplier-csv-to-shopify-bottom" })}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my CSV free
              </Link>
            </Button>
          </div>
        </section>

        {/* Privacy */}
        <section className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            File privacy
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Your CSV is processed in your browser. We do not store uploaded files. We may collect anonymous usage events such as page views, upload, validation, and export clicks, but not your CSV contents.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </section>
      </main>
    </div>
  );
}
