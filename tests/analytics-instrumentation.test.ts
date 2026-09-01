import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const analyticsSource = readFileSync("src/lib/analytics.ts", "utf8");

assert.match(
  analyticsSource,
  /buildAnalyticsContext/,
  "analytics must enrich events with consistent traffic and landing attribution",
);

assert.match(
  analyticsSource,
  /capture_pageview:\s*false/,
  "automatic pageviews must be disabled so the enriched pageview is the only pageview",
);
assert.doesNotMatch(
  analyticsSource,
  /capture_pageview:\s*true/,
  "unenriched automatic PostHog pageviews would pollute qualified-traffic reporting",
);
assert.match(
  analyticsSource,
  /posthog\.register\(context\)/,
  "traffic classification must be registered for automatic lifecycle events",
);
assert.match(
  analyticsSource,
  /posthog\.capture\("\$pageview", context\)/,
  "the manual pageview must include traffic classification and UTM context",
);
assert.match(
  analyticsSource,
  /before_send:\s*sanitizeAnalyticsCapture/,
  "PostHog-generated URL properties must be stripped of query strings before sending",
);
assert.match(
  analyticsSource,
  /safeBrowserStorage/,
  "blocked browser storage getters must not disable analytics initialization",
);
assert.match(
  analyticsSource,
  /enrichWorkflowProperties/,
  "downstream events must inherit only valid sample versus user-upload source types",
);

console.log("Analytics instrumentation regression tests passed");
