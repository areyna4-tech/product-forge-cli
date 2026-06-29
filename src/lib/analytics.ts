// Lightweight analytics with PostHog.
import posthog from "posthog-js";

export type AnalyticsEvent =
  | "landing_page_view"
  | "check_csv_cta_clicked"
  | "sample_file_loaded"
  | "csv_uploaded"
  | "target_format_selected"
  | "mapping_changed"
  | "validation_completed"
  | "blocker_found"
  | "warning_found"
  | "validation_report_downloaded"
  | "output_preview_viewed"
  | "export_clicked"
  | "payment_modal_viewed"
  | "payment_intent_yes"
  | "payment_intent_no"
  | "payment_intent_maybe"
  | "paid_export_completed"
  | "mapping_template_copied"
  | "feedback_submitted"
  | "beta_export_downloaded"
  | "post_export_feedback_submitted"
  | "free_beta_export_used"
  | "free_export_limit_reached"
  | "paid_beta_interest_clicked"
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
    });
  } catch {
    // no-op
  }
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

// Strip any potentially sensitive fields before sending.
const SENSITIVE_KEYS = new Set([
  "email",
  "filename", "file_name", "fileName",
  "sourceValue", "value",
  "note", "feedback", "feedback_note", "feedback_text",
  "sourceColumn", "source_column", "source_column_label",
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

    // Emit email_submitted alongside any event that carried an email.
    if (properties.email && event !== "email_submitted") {
      posthog.capture("email_submitted", { source_event: event });
    }
  } catch {
    // no-op
  }
}
