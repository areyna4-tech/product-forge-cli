import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Shield, Check, FileSpreadsheet, Wrench, ListFilter, ArrowRightLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/fix-shopify-product-csv")({
  head: () => ({
    meta: [
      { title: "Fix Shopify Product CSV Files | Product Forge" },
      { name: "description", content: "Clean up supplier product CSVs for Shopify. Fix field mappings, validate data, remove blocked rows, and download a beta Shopify-ready export." },
      { property: "og:title", content: "Fix Shopify Product CSV Files | Product Forge" },
      { property: "og:description", content: "Clean up supplier product CSVs for Shopify. Fix field mappings, validate data, remove blocked rows, and download a beta Shopify-ready export." },
      { property: "og:url", content: "https://productcsvfixer.com/fix-shopify-product-csv" },
    ],
    links: [{ rel: "canonical", href: "https://productcsvfixer.com/fix-shopify-product-csv" }],
  }),
  component: FixShopifyProductCsvPage,
});

function FixShopifyProductCsvPage() {
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
            Fix product CSV problems before importing to Shopify
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Supplier spreadsheets are rarely Shopify-ready. Map fields, clean data, validate every row, and export a file Shopify will actually accept.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "fix-shopify-product-csv" })}
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
            The supplier CSV problem
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Most supplier files use custom column names, mixed formats, and inconsistent pricing. Before you can import to Shopify, you need to map those columns to Shopify&rsquo;s expected fields, validate the data, and remove rows that would break the import. ProductCSVFixer does that in one flow.
          </p>
        </section>

        {/* Steps */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: FileSpreadsheet,
              title: "Upload your supplier CSV",
              desc: "Drag and drop any product CSV. We accept files from suppliers, marketplaces, or your own exports.",
            },
            {
              icon: ArrowRightLeft,
              title: "Map fields automatically",
              desc: "Our tool suggests mappings between your columns and Shopify fields. Review and adjust in seconds.",
            },
            {
              icon: ListFilter,
              title: "Validate every row",
              desc: "Check for missing titles, bad prices, duplicate SKUs, malformed image URLs, and required field gaps.",
            },
            {
              icon: Wrench,
              title: "Apply transforms",
              desc: "Trim whitespace, fix casing, generate URL handles, clean image URLs, and format numbers automatically.",
            },
            {
              icon: Download,
              title: "Export Shopify-ready CSV",
              desc: "Download a cleaned CSV with blocked rows removed and fields mapped for direct Shopify import.",
            },
            {
              icon: Shield,
              title: "Privacy first",
              desc: "Everything runs in your browser. Your file is never uploaded to a server.",
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

        {/* What it fixes */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Common CSV problems we fix
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { title: "Field mapping", desc: "Your columns are matched to Shopify fields like Title, SKU, Price, Handle, and Image URL." },
              { title: "Data cleanup", desc: "Whitespace trimming, case normalization, handle generation, and currency-to-number conversion." },
              { title: "Row validation", desc: "Critical errors block export. Warnings are shown so you can decide what to fix." },
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
            Clean your supplier CSV for Shopify now
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Upload, map, validate, and export — all in your browser. No signup needed.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "fix-shopify-product-csv-bottom" })}
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
