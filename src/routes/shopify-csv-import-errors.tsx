import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Shield, Check, AlertTriangle, Tag, Image, DollarSign, FileSpreadsheet, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/shopify-csv-import-errors")({
  head: () => ({
    meta: [
      { name: "robots", content: "index, follow" },
      { title: "Shopify CSV Import Errors Checker | Product Forge" },
      { name: "description", content: "Find and fix Shopify CSV import errors before upload. Check for missing SKUs, invalid prices, image URL issues, duplicate SKUs or handles, and required Shopify fields." },
      { property: "og:title", content: "Shopify CSV Import Errors Checker | Product Forge" },
      { property: "og:description", content: "Find and fix Shopify CSV import errors before upload. Check for missing SKUs, invalid prices, image URL issues, duplicate SKUs or handles, and required Shopify fields." },
      { property: "og:url", content: "https://productcsvfixer.com/shopify-csv-import-errors" },
    ],
    links: [{ rel: "canonical", href: "https://productcsvfixer.com/shopify-csv-import-errors" }],
  }),
  component: ShopifyCsvImportErrorsPage,
});

function ShopifyCsvImportErrorsPage() {
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
            Fix Shopify CSV import errors before upload
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Shopify rejects CSVs with missing SKUs, bad prices, broken image URLs, and duplicate handles. Scan your file in seconds and get a clear fix list.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "shopify-csv-import-errors" })}
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
            Why Shopify CSV imports fail
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Shopify&rsquo;s product import is strict. A single missing SKU or a price formatted as text can block the entire upload. Most failures come from supplier spreadsheets that were never designed for Shopify&rsquo;s structure. Our checker finds those blockers before you waste time in the Shopify admin.
          </p>
        </section>

        {/* Blockers */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: KeyRound,
              title: "Missing SKUs",
              desc: "Shopify requires a unique SKU for inventory tracking. Empty SKU cells are flagged as errors.",
            },
            {
              icon: DollarSign,
              title: "Invalid prices",
              desc: "Prices with currency symbols, commas, or text values break Shopify&rsquo;s number parser. We detect and report them.",
            },
            {
              icon: Image,
              title: "Image URL issues",
              desc: "Broken, non-HTTPS, or malformed image links cause missing product photos after import.",
            },
            {
              icon: Tag,
              title: "Duplicate SKUs or handles",
              desc: "Duplicate identifiers create merge conflicts. We surface every duplicate so you can fix them before upload.",
            },
            {
              icon: FileSpreadsheet,
              title: "Missing required fields",
              desc: "Title, handle, and price are required. We flag rows that are missing any of these core fields.",
            },
            {
              icon: AlertTriangle,
              title: "Blocked rows",
              desc: "Rows with critical errors are excluded from the export so they do not create bad imports.",
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

        {/* How it helps */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            How ProductCSVFixer helps
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { title: "Upload", desc: "Drop your supplier CSV into the browser. No account needed." },
              { title: "Review blockers", desc: "See a clear report of errors, warnings, and which rows are blocked." },
              { title: "Export clean CSV", desc: "Download a Shopify-ready file with mapped fields and blocked rows removed." },
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
            Ready to find your CSV import errors?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Upload your file, get a validation report in seconds, and export a Shopify-ready CSV.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "shopify-csv-import-errors-bottom" })}
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
