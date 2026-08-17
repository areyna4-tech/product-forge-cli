import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, Check, FileSpreadsheet, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

const pageUrl = "https://productcsvfixer.com/shopify-csv-import-not-working";
const pageTitle = "Shopify CSV Import Not Working? Find the Row Blocking Upload | ProductCSVFixer";
const pageDescription =
  "Shopify CSV import not working? Find missing fields, duplicate SKUs, invalid prices, and row-level blockers before you reupload to Shopify.";

const checkpoints = [
  {
    title: "Find the import blocker",
    desc: "Identify rows that are likely to stop or damage the Shopify import.",
  },
  {
    title: "Preview issues before paying",
    desc: "See a free summary and limited examples before unlocking the full report.",
  },
  {
    title: "Export only ready rows",
    desc: "Download a Shopify-ready export for rows that pass validation after unlock.",
  },
];

const faqItems = [
  {
    question: "Why is my Shopify CSV import not working?",
    answer:
      "Common causes include missing titles, missing handles, invalid prices, duplicate SKUs, private image URLs, and variant rows that do not match Shopify CSV expectations.",
  },
  {
    question: "Can I check the file before uploading to Shopify?",
    answer: "Yes. ProductCSVFixer checks your CSV in the browser before you upload it to Shopify.",
  },
  {
    question: "Does this fix every row automatically?",
    answer:
      "No. ProductCSVFixer identifies blockers and exports rows that pass validation. Blocked rows should be fixed in the source file and checked again.",
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

export const Route = createFileRoute("/shopify-csv-import-not-working")({
  head: () => ({
    meta: [
      { name: "robots", content: "index, follow" },
      {
        title: "Shopify CSV Import Not Working? Find the Row Blocking Upload | ProductCSVFixer",
      },
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
  component: ShopifyCsvImportNotWorkingPage,
});

function ShopifyCsvImportNotWorkingPage() {
  useEffect(() => {
    track("seo_page_viewed", {
      landing_path: "/shopify-csv-import-not-working",
      source_page: "/shopify-csv-import-not-working",
    });
  }, []);

  const trackCta = (location: string) => {
    track("seo_cta_clicked", {
      landing_path: "/shopify-csv-import-not-working",
      source_page: "/shopify-csv-import-not-working",
      cta_location: location,
    });
    track("check_csv_cta_clicked", {
      landing_path: "/shopify-csv-import-not-working",
      source_page: "/shopify-csv-import-not-working",
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
            Shopify CSV Import Not Working
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
            Shopify CSV import not working? Find the row blocking upload
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            If your Shopify CSV import is not working, the problem is usually hidden in the
            spreadsheet: missing required fields, invalid prices, duplicate SKUs, broken image URLs,
            or rows Shopify cannot read. ProductCSVFixer helps you find those blockers before
            another failed upload.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => trackCta("shopify-csv-import-not-working-hero")}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my Shopify CSV free
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
                Why Shopify says the CSV import is not working
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                Shopify can reject or partially import a product CSV when one column is missing, one
                value is formatted incorrectly, or one row breaks the expected product/variant
                structure. A pre-flight check gives you a shorter list of what to fix before trying
                the import again.
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
              onClick={() => trackCta("shopify-csv-import-not-working-bottom")}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my Shopify CSV free
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
