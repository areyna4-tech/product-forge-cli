import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  Image,
  KeyRound,
  Shield,
  Tag,
  Upload,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

const pageUrl = "https://productcsvfixer.com/shopify-csv-validator";
const pageTitle = "Shopify CSV Validator | Check Import Errors Free";
const pageDescription =
  "Free Shopify CSV validator for product imports. Check missing SKUs, invalid prices, duplicate SKUs, image URL problems, required fields, and export readiness before upload.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ProductCSVFixer Shopify CSV Validator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  description: pageDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description:
      "Free beta scan with one beta export while ProductCSVFixer validates self-serve paid exports.",
  },
  featureList: [
    "Shopify product CSV validation",
    "Missing SKU detection",
    "Invalid price checks",
    "Duplicate SKU warnings",
    "Image URL validation",
    "Required field mapping",
    "Browser-based CSV processing",
  ],
};

export const Route = createFileRoute("/shopify-csv-validator")({
  head: () => ({
    meta: [
      { name: "robots", content: "index, follow" },
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: pageUrl },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: pageDescription },
    ],
    links: [{ rel: "canonical", href: pageUrl }],
  }),
  component: ShopifyCsvValidatorPage,
});

function ShopifyCsvValidatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          <div className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            ProductCSVFixer
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Shopify CSV Validator
          </p>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Check product CSV import blockers before Shopify upload. Validate required fields, SKUs,
            prices, image URLs, and export readiness in your browser.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-6">
        <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Free Shopify CSV validator for product imports
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Upload a supplier or Shopify product CSV and see whether it is ready to import.
            ProductCSVFixer flags missing SKUs, invalid prices, duplicate identifiers, broken image
            URLs, and blocked rows before you use Shopify admin.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "shopify-csv-validator" })}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Validate my CSV free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No signup required. Runs locally in your browser. One free beta export during
            validation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What this Shopify CSV validator checks
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: KeyRound,
                title: "Missing SKUs",
                desc: "Find blank SKU cells and rows that could break inventory workflows or variant imports.",
              },
              {
                icon: DollarSign,
                title: "Invalid prices",
                desc: "Catch prices that contain text, malformed currency values, or formats Shopify may reject.",
              },
              {
                icon: Tag,
                title: "Duplicate SKUs and handles",
                desc: "Surface duplicate identifiers before they create product or variant conflicts in Shopify.",
              },
              {
                icon: Image,
                title: "Image URL issues",
                desc: "Flag malformed image links so missing product photos are easier to diagnose before import.",
              },
              {
                icon: FileSpreadsheet,
                title: "Required fields",
                desc: "Confirm that required Shopify product fields are mapped from your CSV headers.",
              },
              {
                icon: AlertTriangle,
                title: "Blocked rows and warnings",
                desc: "Separate import-blocking errors from review-only warnings so the next action is clear.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Upload or try the sample",
              desc: "Start with a real product CSV or use the sample file to see the validator output without sharing sensitive data.",
            },
            {
              title: "2. Review import readiness",
              desc: "Get a clear ready, review recommended, or import blocked result with row counts and issue details.",
            },
            {
              title: "3. Export clean rows",
              desc: "Preview and download a Shopify-ready beta export with blocked rows excluded during the free beta.",
            },
          ].map((step) => (
            <Card key={step.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Validate a Shopify CSV before your next import
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Use ProductCSVFixer as a pre-flight check before uploading product data to Shopify.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() =>
                track("check_csv_cta_clicked", { source: "shopify-csv-validator-bottom" })
              }
            >
              <Link to="/">
                <Download className="h-4 w-4 mr-1.5" />
                Check my CSV free
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Privacy-first CSV validation
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            ProductCSVFixer processes CSV files in your browser. We do not store uploaded files and
            we do not collect product names, SKUs, prices, image URLs, row values, or CSV contents.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { icon: Check, label: "No signup required" },
              { icon: Shield, label: "Runs locally in your browser" },
              { icon: FileSpreadsheet, label: "Shopify-ready export preview" },
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
