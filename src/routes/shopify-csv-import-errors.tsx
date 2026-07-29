import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  AlertTriangle,
  Check,
  DollarSign,
  FileSpreadsheet,
  Image,
  KeyRound,
  Shield,
  Tag,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { track } from "@/lib/analytics";

const pageUrl = "https://productcsvfixer.com/shopify-csv-import-errors";
const pageTitle = "Shopify CSV Import Errors: Common Causes and How to Fix Them";
const pageDescription =
  "Find and fix common Shopify CSV import errors including missing handles, invalid prices, duplicate SKUs, image URL problems, variant issues, and malformed rows.";

const faqItems = [
  {
    question: "Why does my Shopify CSV import fail?",
    answer:
      "Shopify CSV imports often fail because required fields are missing, prices are formatted incorrectly, handles are missing or inconsistent, image URLs are broken, or variant rows do not match Shopify's expected format.",
  },
  {
    question: "What fields are required in a Shopify product CSV?",
    answer:
      "The exact fields depend on your file and product setup, but Shopify product CSVs commonly rely on fields like title, handle, variant SKU, price, option names, option values, and image URLs.",
  },
  {
    question: "Can duplicate SKUs cause Shopify import problems?",
    answer:
      "Duplicate SKUs can cause inventory, reporting, and product management problems. Some stores reuse SKUs intentionally, but accidental duplicates should be reviewed before import.",
  },
  {
    question: "Why are my Shopify product images not importing?",
    answer:
      "Product images may fail to import if the CSV uses local filenames, private links, broken URLs, or incomplete image paths. Shopify generally needs a valid public image URL.",
  },
  {
    question: "Can I fix Shopify CSV errors before uploading the file?",
    answer:
      "Yes. ProductCSVFixer helps identify common CSV problems before upload so you can fix the file before importing it into Shopify.",
  },
  {
    question: "Do I need a Shopify app to check my CSV?",
    answer: "No. You can check your CSV before importing without connecting your Shopify store.",
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

const commonErrors = [
  {
    icon: FileSpreadsheet,
    title: "Missing product titles",
    desc: "A row with no Title can be rejected or create a product that is hard to manage.",
  },
  {
    icon: Tag,
    title: "Missing or duplicate handles",
    desc: "Shopify uses handles to group product data and create product URLs. Inconsistent handles can create messy imports.",
  },
  {
    icon: KeyRound,
    title: "Duplicate SKUs",
    desc: "Duplicate SKUs can create inventory, reporting, and product management problems.",
  },
  {
    icon: DollarSign,
    title: "Invalid prices",
    desc: "Currency symbols, text, and inconsistent decimal formats can stop Shopify from reading the price correctly.",
  },
  {
    icon: Image,
    title: "Broken image URLs",
    desc: "Local filenames, private links, and incomplete paths can prevent Shopify from importing product images.",
  },
  {
    icon: AlertTriangle,
    title: "Variant option problems",
    desc: "Variant rows need consistent option names and values so products import cleanly.",
  },
];

const relatedGuides = [
  {
    to: "/shopify-csv-validator",
    title: "Free Shopify CSV validator",
    desc: "Check your product CSV before importing it into Shopify.",
  },
  {
    to: "/fix-shopify-product-csv",
    title: "Fix Shopify product CSV files",
    desc: "Clean supplier files, prices, SKUs, images, and required fields.",
  },
  {
    to: "/supplier-csv-to-shopify",
    title: "Supplier CSV to Shopify",
    desc: "Prepare supplier product spreadsheets for Shopify import.",
  },
];

export const Route = createFileRoute("/shopify-csv-import-errors")({
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
  component: ShopifyCsvImportErrorsPage,
});

function ShopifyCsvImportErrorsPage() {
  useEffect(() => {
    track("seo_page_viewed", {
      landing_path: "/shopify-csv-import-errors",
      source_page: "/shopify-csv-import-errors",
    });
  }, []);

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
            Shopify CSV Import Errors
          </p>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Find missing fields, invalid prices, duplicate SKUs, image URL problems, and variant
            issues before your Shopify product import fails.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-8">
        <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Fix Shopify CSV import errors before upload
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Shopify CSV imports can fail because of one bad column, one missing title, one invalid
            price, or one broken image URL. ProductCSVFixer helps you find common import problems
            before you upload the file to Shopify.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => {
                track("seo_cta_clicked", {
                  landing_path: "/shopify-csv-import-errors",
                  source_page: "/shopify-csv-import-errors",
                  cta_location: "shopify-csv-import-errors-hero",
                });
                track("check_csv_cta_clicked", {
                  landing_path: "/shopify-csv-import-errors",
                  source_page: "/shopify-csv-import-errors",
                  cta_location: "shopify-csv-import-errors-hero",
                  source: "shopify-csv-import-errors-hero",
                });
              }}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my CSV free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Find CSV problems before Shopify rejects your product import.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Why Shopify CSV imports fail
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            A Shopify CSV import usually fails because the file does not match the format Shopify
            expects. The spreadsheet may open normally in Excel or Google Sheets, but Shopify still
            needs certain fields, clean formatting, and valid product data.
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            Common problems include missing product titles, duplicate handles, invalid prices,
            broken image links, and variant rows that do not line up correctly. When one of these
            issues is hidden inside a large product file, it can be hard to find manually.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Common Shopify CSV import errors
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {commonErrors.map(({ icon: Icon, title, desc }) => (
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

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Before and after CSV examples
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Problem row</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {`Handle,Title,Variant SKU,Variant Price\nblue-shirt,,BS-001,$19.99`}
                </pre>
                <p className="mt-3 text-sm text-muted-foreground">
                  This row has a missing title and a price with a currency symbol.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cleaner row</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {`Handle,Title,Variant SKU,Variant Price\nblue-shirt,Blue Shirt,BS-001,19.99`}
                </pre>
                <p className="mt-3 text-sm text-muted-foreground">
                  The title is filled in and the price is a plain number Shopify can read.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            How ProductCSVFixer helps find CSV import problems
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            ProductCSVFixer checks your product CSV and shows issues that may block or damage a
            Shopify import. Instead of guessing why Shopify rejected your file, you can check the
            CSV first and fix the obvious problems before uploading.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Upload your CSV",
                desc: "Drop your product or supplier CSV into the checker. No Shopify connection needed.",
              },
              {
                title: "Review the issue report",
                desc: "See missing fields, duplicate SKUs, invalid prices, image URL problems, and blocked rows.",
              },
              {
                title: "Fix before import",
                desc: "Use the report to clean the file before uploading products to Shopify.",
              },
            ].map((step) => (
              <Card key={step.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Before you import into Shopify, check these items
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "Does every product have a title?",
              "Are product handles present and consistent?",
              "Are SKUs unique where they should be?",
              "Are prices plain numbers without currency symbols?",
              "Are image URLs full public links?",
              "Are variant option fields consistent?",
              "Are there any empty rows?",
              "Does the file use the expected Shopify CSV headers?",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Ready to find your CSV import errors?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Check your Shopify product CSV before uploading it. Find the rows and fields that need
            attention before they break your import.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => {
                track("seo_cta_clicked", {
                  landing_path: "/shopify-csv-import-errors",
                  source_page: "/shopify-csv-import-errors",
                  cta_location: "shopify-csv-import-errors-bottom",
                });
                track("check_csv_cta_clicked", {
                  landing_path: "/shopify-csv-import-errors",
                  source_page: "/shopify-csv-import-errors",
                  cta_location: "shopify-csv-import-errors-bottom",
                  source: "shopify-csv-import-errors-bottom",
                });
              }}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Check my CSV free
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">File privacy</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            You do not need to connect your Shopify store to check your CSV. ProductCSVFixer is
            built for store owners who want a quick way to review product import problems before
            uploading a file.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { icon: Check, label: "No signup required" },
              { icon: Shield, label: "No Shopify login required" },
              { icon: FileSpreadsheet, label: "Shopify CSV focused" },
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

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Shopify CSV import errors FAQ
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.question}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.answer}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Related Shopify CSV guides
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {relatedGuides.map((guide) => (
              <li key={guide.to}>
                <Link
                  to={guide.to}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {guide.title}
                </Link>{" "}
                — {guide.desc}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
