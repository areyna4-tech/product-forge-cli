import { ok, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/routes/index.tsx", "utf8");
const analytics = readFileSync("src/lib/analytics.ts", "utf8");

for (const phrase of [
  "Unlock full validation report + Shopify-ready export",
  "Previewing the first",
  "Full report unlocked",
  "exact row/cell issue details",
  "Download Shopify-ready export",
  "sample file remains fully free",
]) {
  ok(source.includes(phrase), `Expected paid unlock/free-preview copy: ${phrase}`);
}

for (const eventName of [
  "free_preview_viewed",
  "paid_unlock_clicked",
  "paid_checkout_returned_success",
  "paid_checkout_returned_cancelled",
  "paid_report_viewed",
  "paid_export_downloaded",
]) {
  ok(source.includes(eventName), `Expected source to track ${eventName}`);
  ok(analytics.includes(eventName), `Expected analytics event union to include ${eventName}`);
}

ok(source.includes("ISSUE_PREVIEW_LIMIT = 5"), "Expected a five-issue free preview limit");
ok(
  source.includes("isSampleFile") || source.includes('fileSourceType === "sample"'),
  "Expected sample file exemption logic",
);
ok(source.includes("visibleBlockingIssues"), "Expected gated visible blocking issue list");
ok(source.includes("visibleWarningIssues"), "Expected gated visible warning issue list");
ok(source.includes("handlePaidUnlock"), "Expected paid unlock checkout handler");
ok(source.includes("paid_export=success"), "Expected success redirect handling");
ok(source.includes("paid_export=cancelled"), "Expected cancel redirect handling");

for (const phrase of [
  "fixed CSV",
  "we fix every issue",
  "fully repaired",
  "send us your file",
  "manual cleanup",
]) {
  equal(
    source.toLowerCase().includes(phrase),
    false,
    `Avoid overpromising/manual-service copy: ${phrase}`,
  );
}

console.log("Paid unlock gating assertions passed");
