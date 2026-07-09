// Lightweight analytics with PostHog.
import posthog from "posthog-js";

export type AnalyticsEvent =
  | "landing_page_view"
  | "primary_cta_clicked"
  | "check_csv_cta_clicked"
  | "sample_file_clicked"
  | "sample_file_loaded"
  | "csv_upload_started"
  | "csv_upload_succeeded"
  | "csv_upload_failed"
  | "csv_uploaded"
  | "target_format_selected"
  | "mapping_changed"
  | "validation_started"
  | "validation_completed"
  | "validation_failed"
  | "report_viewed"
  | "blocker_found"
  | "warning_found"
  | "validation_report_downloaded"
  | "output_preview_viewed"
  | "export_clicked"
  | "export_downloaded"
  | "payment_modal_viewed"
  | "payment_intent_yes"
  | "payment_intent_no"
  | "payment_intent_maybe"
  | "paid_export_completed"
  | "mapping_template_copied"
  | "feedback_submitted"
  | "shopify_ready_export_downloaded"
  | "post_export_feedback_submitted"
  | "free_sample_export_used"
  | "free_export_limit_reached"
  | "paid_export_interest_clicked"
  | "paid_export_gate_viewed"
  | "free_preview_viewed"
  | "paid_unlock_clicked"
  | "paid_checkout_returned_success"
  | "paid_checkout_returned_cancelled"
  | "paid_report_viewed"
  | "paid_export_downloaded"
  | "paid_export_interest_yes"
  | "paid_export_interest_maybe"
  | "paid_export_interest_no"
  | "paid_export_email_submitted"
  | "email_submitted_after_limit"
  | "email_submitted";

const POSTHOG_KEY = "phc_pagfp2QZAiPwyjHkPDpEF54gPiqCTbUsChtVAcR4F8kY";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      disable_session_recording: true,
      autocapture: false,
    });
  } catch {
    // no-op
  }
}

// Eager init so events fired before any track() call also work.
if (typeof window !== "undefined") {
  ensureInit();
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

// Strip any potentially sensitive fields before sending.
const SENSITIVE_KEYS = new Set([
  "email",
  "filename",
  "file_name",
  "fileName",
  "sourceValue",
  "value",
  "note",
  "feedback",
  "feedback_note",
  "feedback_text",
  "sourceColumn",
  "source_column",
  "source_column_label",
]);
function scrub(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (SENSITIVE_KEYS.has(k)) {
      // Convert email/filename presence into a boolean signal only.
      if (k === "email") out.email_provided = Boolean(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  ensureInit();
  const safe = scrub(properties);
  try {
    posthog.capture(event, safe);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...safe, ts: Date.now() });
    if (import.meta.env.DEV) console.debug("[analytics]", event, safe);
  } catch {
    // no-op
  }
}
