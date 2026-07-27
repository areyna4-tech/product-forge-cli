import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  DollarSign,
  Download,
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

const pageUrl = "https://productcsvfixer.com/shopify-csv-validator";
const pageTitle = "Free Shopify Product CSV Validator | Check Import Errors Before Upload";
const pageDescription =
  "Validate your Shopify product CSV before importing. Check missing fields, duplicate SKUs, invalid prices, image URL problems, and formatting issues for free.";

const faqItems = [
  {
    question: "Can I validate a Shopify CSV before importing it?",
    answer:
      "Yes. ProductCSVFixer checks common Shopify product CSV problems before you upload the file to Shopify, including missing fields, duplicate SKUs, invalid prices, image URL issues, and formatting problems.",
  },
  {
    question: "Do I need to log in to Shopify?",
    answer: "No. You do not need to connect your Shopify store or log in with Shopify to check your CSV.",
  },
  {
    question: "What product CSV fields does Shopify require?",
    answer:
      "Shopify product CSV files usually need fields like product title, handle, variant information, price, and other product details. The exact fields depend on your import, but missing or badly formatted fields can cause import problems.",
  },
  {
    question: "Can this check supplier CSV files?",
    answer:
      "Yes. ProductCSVFixer is useful for checking supplier CSV files before trying to import them into Shopify. Supplier files often have missing fields, different column names, invalid prices, or image URL problems.",
  },
  {
    question: "Does the validator fix the CSV automatically?",
    answer:
      "ProductCSVFixer helps identify CSV problems and shows what needs attention. Depending on your workflow, you can use the report to clean the file before importing it into Shopify.",
  },
  {
    question: "Is this only for Shopify product CSVs?",
    answer:
      "ProductCSVFixer is focused on Shopify product CSV imports. It is designed around common product import issues like SKUs, prices, handles, images, variants, and required product fields.",
  },
];

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ProductCSVFixer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  description: "A web tool that checks Shopify product CSV files for common import errors before upload.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

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

const issueExamples = [
  {
    problem: "Missing title",
    example: "The Title field is blank",
    why: "Shopify may reject the row or create an incomplete product",
  },
  {
    problem: "Duplicate SKU",
    example: "Two variants use the same SKU",
    why: "Inventory and reporting can become confusing",
  },
  {
    problem: "Invalid price",
    example: "$19.99 instead of 19.99",
    why: "Shopify expects clean numeric price values",
  },
  {
    problem: "Broken image URL",
    example: "image1.jpg instead of a full URL",
    why: "Shopify may not import the product image",
  },
];

const relatedGuides = [
  {
    to: "/shopify-csv-import-errors",
    title: "Common Shopify CSV import errors",
    desc: "Learn why product imports fail and what to fix.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
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
            Shopify CSV Validator
          </p>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Check your Shopify product CSV before upload. Find missing fields, duplicate SKUs,
            invalid prices, image URL problems, and other import issues before Shopify rejects the
            file.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-8 pb-12 space-y-8">
        <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-10 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Free Shopify CSV validator for product imports
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Before you upload a product CSV to Shopify, check it for common import problems.
            ProductCSVFixer helps find missing titles, duplicate SKUs, invalid prices, image URL
            issues, and other problems that can break your import.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              asChild
              onClick={() => track("check_csv_cta_clicked", { source: "shopify-csv-validator-hero" })}
            >
              <Link to="/">
                <Upload className="h-4 w-4 mr-1.5" />
                Validate my CSV free
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No Shopify login required. Preview CSV problems before Shopify rejects your file.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What this Shopify CSV validator checks
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            Shopify product CSV imports can fail because of small problems hidden inside your
            spreadsheet. ProductCSVFixer checks the most common CSV issues before you upload the file
            to Shopify.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileSpreadsheet,
                title: "Missing required fields",
                desc: "Find missing product titles, handles, prices, and other fields that need attention before import.",
              },
              {
                icon: KeyRound,
                title: "Duplicate SKUs",
                desc: "Surface duplicate SKU values before they create inventory or reporting problems in Shopify.",
              },
              {
                icon: DollarSign,
                title: "Invalid prices",
                desc: "Catch prices with currency symbols, text, commas, or formats Shopify may not read correctly.",
              },
              {
                icon: Image,
                title: "Image URL problems",
                desc: "Flag local filenames, incomplete links, and malformed image URLs before product photos fail to import.",
              },
              {
                icon: Tag,
                title: "Handle and variant issues",
                desc: "Review product handles and variant fields that may create messy product imports.",
              },
              {
                icon: AlertTriangle,
                title: "Blocked rows and warnings",
                desc: "Separate import-blocking errors from review-only warnings so your next action is clear.",
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

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Why validate your Shopify CSV before importing?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            A Shopify product CSV can look fine in Excel or Google Sheets and still fail during
            import. Shopify expects product data to follow a specific format. If required fields are
            missing, prices are formatted incorrectly, or image URLs are broken, your import may fail
            or create incomplete products.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "Catch import blockers before upload",
              "Avoid creating broken products",
              "Save time cleaning rows manually",
              "Find supplier CSV problems early",
              "Check whether your file is close to Shopify-ready",
              "Preview issues before making changes in your store",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Common Shopify CSV problems found before import
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">CSV problem</th>
                  <th className="px-4 py-3 font-semibold">Example</th>
                  <th className="px-4 py-3 font-semibold">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {issueExamples.map((row) => (
                  <tr key={row.problem} className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">{row.problem}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.example}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Upload or try the sample",
              desc: "Start with your product CSV or use the sample file to see how the report works.",
            },
            {
              title: "2. Review import problems",
              desc: "See a clear issue report with row counts, warnings, and blocked rows that need attention.",
            },
            {
              title: "3. Fix before Shopify upload",
              desc: "Use the report to clean your file before importing products into your store.",
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

        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Use it when your Shopify CSV came from anywhere
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
            ProductCSVFixer is helpful when you are importing products into a new Shopify store,
            moving products from another ecommerce platform, cleaning a supplier spreadsheet,
            checking a dropshipping product CSV, preparing bulk product updates, or fixing a file
            after Shopify rejected it.
          </p>
        </section>

        <section className="rounded-xl border bg-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Validate your Shopify CSV before your next import
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Avoid failed imports and messy product uploads. Check your Shopify product CSV for common
            problems before you upload it.
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
            Your product CSV can contain sensitive store or supplier data. ProductCSVFixer is
            designed to help you check the file without needing access to your Shopify account. You
            do not need to connect your store or log in with Shopify to validate your CSV.
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
            Shopify CSV validator FAQ
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
                <Link to={guide.to} className="font-medium text-foreground underline underline-offset-4">
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
