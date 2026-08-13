import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, Check, FileSpreadsheet, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

const pageUrl = "https://productcsvfixer.com/shopify-csv-required-columns";
const pageTitle = "Shopify CSV Required Columns Checker | ProductCSVFixer";
const pageDescription =
  "Check Shopify CSV required columns before upload. Validate titles, handles, SKUs, prices, variants, image URLs, and Shopify-ready product fields.";

const checkpoints = [
  {
    title: "Check required field coverage",
    desc: "Review whether key Shopify product fields are present and mapped.",
  },
  {
    title: "Validate row-level values",
    desc: "Find blank titles, missing prices, missing SKUs, and invalid data.",
  },
  {
    title: "Prepare a Shopify-ready export",
    desc: "Unlock a report and exportable rows after the free validation preview.",
  },
];

const faqItems = [
  {
    question: "What columns are required for a Shopify CSV?",
    answer:
      "Shopify product CSV requirements vary by file, but common important fields include product title, handle, variant SKU, price, option fields, and image URL data.",
  },
  {
    question: "Can a CSV fail even if the required headers exist?",
    answer:
      "Yes. Headers can be present while row values are missing, malformed, duplicated, or mapped incorrectly.",
  },
  {
    question: "Does ProductCSVFixer replace Shopify documentation?",
    answer:
      "No. It is a practical pre-flight checker for common product CSV import blockers before upload.",
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

export const Route = createFileRoute("/shopify-csv-required-columns")({
  head: () => ({
    meta: [
      { name: "robots", content: "index, follow" },
      { title: "Shopify CSV Required Columns Checker | ProductCSVFixer" },
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
  component: ShopifyCsvRequiredColumnsPage,
});

function ShopifyCsvRequiredColumnsPage() {
  useEffect(() => {
    track("seo_page_viewed", {
      landing_path: "/shopify-csv-required-columns",
      source_page: "/shopify-csv-required-columns",
    });
  }, []);

  const trackCta = (location: string) => {
    track("seo_cta_clicked", {
      landing_path: "/shopify-csv-required-columns",
      source_page: "/shopify-csv-required-columns",
      cta_location: location,
    });
    track("check_csv_cta_clicked", {
      landing_path: "/shopify-csv-required-columns",
      source_page: "/shopify-csv-required-columns",
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
            Shopify CSV Required Columns
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
            Check Shopify CSV required columns before upload
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            A Shopify product CSV can fail when required columns are missing, mapped incorrectly, or
            filled with unusable values. ProductCSVFixer checks Shopify CSV required columns and
            shows which rows are blocked before upload.
          </p>
          <div className="mt-5 flex justify-center">
            <Button size="lg" asChild onClick={() => trackCta("shopify-csv-required-columns-hero")}>
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check required columns free
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
                Required columns are more than just headers
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                A CSV may contain the right header names but still fail because values are blank,
                prices are malformed, variants are inconsistent, or supplier columns were mapped to
                the wrong Shopify fields. Checking both headers and row values prevents bad imports.
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
              onClick={() => trackCta("shopify-csv-required-columns-bottom")}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check required columns free
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
