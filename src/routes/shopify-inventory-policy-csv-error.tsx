import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, Check, FileSpreadsheet, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

const pageUrl = "https://productcsvfixer.com/shopify-inventory-policy-csv-error";
const pageTitle = "Shopify Inventory Policy CSV Error Checker | ProductCSVFixer";
const pageDescription =
  "Check Shopify CSV inventory policy errors before import, including values that trigger inventory policy is not included in the list warnings.";

const checkpoints = [
  {
    title: "Catch invalid policy values",
    desc: "Flag rows where inventory policy-like values may need review before import.",
  },
  {
    title: "Review related SKU issues",
    desc: "Inventory errors often appear with missing SKUs, duplicate SKUs, or messy variant rows.",
  },
  {
    title: "Avoid repeated upload failures",
    desc: "Run a pre-flight check before trying the same Shopify import again.",
  },
];

const faqItems = [
  {
    question: "What causes the inventory policy Shopify CSV error?",
    answer:
      "The value in the inventory policy column may be blank, misspelled, unsupported, or formatted differently from Shopify expectations.",
  },
  {
    question: "Can ProductCSVFixer show the exact rows to review?",
    answer:
      "The free preview shows summary counts and limited examples. The paid unlock provides the full validation report.",
  },
  {
    question: "Should I upload the same CSV again after this error?",
    answer: "Check and fix the source CSV first, then rerun validation before importing again.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export const Route = createFileRoute("/shopify-inventory-policy-csv-error")({
  head: () => ({
    meta: [
      { name: "robots", content: "index, follow" },
      { title: "Shopify Inventory Policy CSV Error Checker | ProductCSVFixer" },
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
  component: ShopifyInventoryPolicyCsvErrorPage,
});

function ShopifyInventoryPolicyCsvErrorPage() {
  useEffect(() => {
    track("seo_page_viewed", {
      landing_path: "/shopify-inventory-policy-csv-error",
      source_page: "/shopify-inventory-policy-csv-error",
    });
  }, []);

  const trackCta = (location: string) => {
    track("seo_cta_clicked", {
      landing_path: "/shopify-inventory-policy-csv-error",
      source_page: "/shopify-inventory-policy-csv-error",
      cta_location: location,
    });
    track("check_csv_cta_clicked", {
      landing_path: "/shopify-inventory-policy-csv-error",
      source_page: "/shopify-inventory-policy-csv-error",
      cta_location: location,
      source: location,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="border-b bg-card">
        <div className="mx-auto max-w-[1120px] px-6 py-8">
          <div className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            ProductCSVFixer
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Shopify Inventory Policy CSV Error
          </p>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Browser-based Shopify CSV checks for store owners who want to catch import blockers
            before uploading product data.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-8">
        <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Fix Shopify inventory policy CSV errors before import
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            The Shopify error inventory policy is not included in the list usually means the CSV
            contains an inventory policy value Shopify does not accept. ProductCSVFixer helps you
            catch invalid inventory, SKU, price, and required-field problems before upload.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => trackCta("shopify-inventory-policy-csv-error-hero")}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check inventory policy errors free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free preview first. Unlock the full validation report + Shopify-ready export for $9.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {checkpoints.map((item) => (
            <Card key={item.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.desc}</CardContent>
            </Card>
          ))}
        </section>
        <section className="rounded-xl border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                What inventory policy is not included in the list means
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                Inventory policy values must match what Shopify expects. If a supplier file contains
                custom text, blank values, inconsistent casing, or unsupported values, Shopify may
                reject that row or report the inventory policy error during import.
              </p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What ProductCSVFixer checks
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              "Required product fields and Shopify-ready column structure",
              "Missing titles, handles, SKUs, prices, and variant values",
              "Invalid price formats, duplicate SKUs, duplicate handles, and broken image URLs",
              "Rows that should be fixed before upload versus rows ready for export",
            ].map((item) => (
              <Card key={item}>
                <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{item}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-primary/5 p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Check your Shopify CSV before the next import attempt
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Upload a non-sensitive CSV, review a free issue preview, and decide whether the full
            validation report and Shopify-ready export are worth unlocking.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => trackCta("shopify-inventory-policy-csv-error-bottom")}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check inventory policy errors free
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
