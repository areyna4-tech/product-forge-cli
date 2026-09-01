import { ok } from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const homepagePath = "src/routes/index.tsx";
const reportPath = "public/productcsvfixer-sample-validation-report.csv";
const homepage = readFileSync(homepagePath, "utf8");

ok(existsSync(reportPath), "Story 3 should include a downloadable demonstration report");

const report = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";

for (const heading of [
  "Row",
  "Column",
  "Severity",
  "Problem",
  "Current Value",
  "Expected Format",
  "Recommended Action",
]) {
  ok(report.includes(heading), `Sample report should include ${heading}`);
}

for (const issue of ["Variant Price", "Variant SKU", "Image Src"]) {
  ok(report.includes(issue), `Sample report should demonstrate ${issue} guidance`);
}

for (const phrase of [
  "See what the $9 report includes",
  "<h2",
  'id="sample-report-heading"',
  'aria-labelledby="sample-report-heading"',
  "Illustrative ProductCSVFixer validation report excerpt",
  "exact row, column, current value, and recommended action",
  "Illustrative demonstration — not customer data",
  "/productcsvfixer-sample-validation-report.csv",
  "Download sample validation report",
  'cta_location: "sample_validation_report"',
  'cta_type: "sample_report_download"',
]) {
  ok(homepage.includes(phrase), `Homepage should make the paid result tangible: ${phrase}`);
}

for (const metric of [
  '["327", "rows checked"]',
  '["289", "ready for Shopify"]',
  '["26", "warning rows"]',
  '["12", "blocked rows"]',
]) {
  ok(homepage.includes(metric), `Homepage should show the demonstration metric: ${metric}`);
}

ok(
  homepage.includes("Full report + Shopify-ready export") && homepage.includes("Free preview"),
  "Example should distinguish the free preview from the paid deliverables",
);

console.log("Realistic sample report assertions passed");
