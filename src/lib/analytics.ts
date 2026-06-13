// Lightweight analytics event hook.
// Replace the implementation of `track` with a real analytics SDK
// (PostHog, GA4, Plausible, Segment, etc.) when ready.
//
// Defined events:
//   landing_page_view
//   check_csv_cta_clicked
//   sample_file_loaded
//   csv_uploaded
//   target_format_selected
//   mapping_changed
//   validation_completed
//   blocker_found
//   warning_found
//   validation_report_downloaded
//   output_preview_viewed
//   export_clicked
//   payment_modal_viewed
//   payment_intent_yes
//   payment_intent_no
//   payment_intent_maybe
//   paid_export_completed
//   mapping_template_copied
//   feedback_submitted

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
  | "email_submitted_after_limit";



declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    // Push to a generic dataLayer so GTM/GA4 or similar can pick it up.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...properties, ts: Date.now() });
    // Helpful during validation/user-testing phase.
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.debug("[analytics]", event, properties);
  } catch {
    // no-op
  }
}
