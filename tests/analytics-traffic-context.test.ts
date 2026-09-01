import assert from "node:assert/strict";
import {
  buildAnalyticsContext,
  enrichWorkflowProperties,
  INTERNAL_QA_STORAGE_KEY,
  resolveWorkflowSource,
  safeBrowserStorage,
  sanitizeAnalyticsCapture,
} from "../src/lib/analytics-context";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function context(
  href: string,
  options: {
    referrer?: string;
    userAgent?: string;
    webdriver?: boolean;
    isDevelopment?: boolean;
    localStorage?: MemoryStorage;
    sessionStorage?: MemoryStorage;
  } = {},
) {
  return buildAnalyticsContext({
    href,
    referrer: options.referrer ?? "",
    userAgent: options.userAgent ?? "Mozilla/5.0",
    webdriver: options.webdriver ?? false,
    isDevelopment: options.isDevelopment ?? false,
    localStorage: options.localStorage ?? new MemoryStorage(),
    sessionStorage: options.sessionStorage ?? new MemoryStorage(),
  });
}

{
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const marked = context("https://productcsvfixer.com/?pcf_qa=1", {
    localStorage,
    sessionStorage,
  });
  assert.equal(marked.traffic_class, "internal_qa");
  assert.equal(marked.is_internal_traffic, true);
  assert.equal(localStorage.getItem(INTERNAL_QA_STORAGE_KEY), "true");

  const persisted = context("https://productcsvfixer.com/shopify-csv-validator", {
    localStorage,
    sessionStorage,
  });
  assert.equal(persisted.traffic_class, "internal_qa");

  const cleared = context("https://productcsvfixer.com/?pcf_qa=0", {
    localStorage,
    sessionStorage,
  });
  assert.equal(cleared.is_internal_traffic, false);
  assert.equal(cleared.traffic_class, "direct");
}

{
  assert.equal(
    context("https://productcsvfixer.com/", {
      referrer: "https://www.google.com/search?q=shopify+csv",
    }).traffic_class,
    "organic_search",
  );
  assert.equal(
    context("https://productcsvfixer.com/?utm_source=google&utm_medium=cpc", {
      referrer: "https://www.google.com/search?q=shopify+csv",
    }).traffic_class,
    "campaign",
  );
  assert.equal(
    context("https://productcsvfixer.com/?utm_source=reddit&utm_medium=community", {
      referrer: "https://www.reddit.com/r/shopify/",
    }).traffic_class,
    "community_referral",
  );
  assert.equal(context("https://productcsvfixer.com/").traffic_class, "direct");
  assert.equal(
    context("https://productcsvfixer.com/", { webdriver: true }).traffic_class,
    "suspected_bot",
  );
}

{
  const sessionStorage = new MemoryStorage();
  const first = context(
    "https://productcsvfixer.com/shopify-csv-import-errors?utm_source=reddit&utm_medium=community&utm_campaign=august-launch",
    { sessionStorage },
  );
  assert.equal(first.landing_path, "/shopify-csv-import-errors");
  assert.equal(first.source_page, "/shopify-csv-import-errors");
  assert.equal(first.utm_source, "reddit");
  assert.equal(first.utm_medium, "community");
  assert.equal(first.utm_campaign, "august-launch");

  const next = context("https://productcsvfixer.com/", { sessionStorage });
  assert.equal(next.landing_path, "/shopify-csv-import-errors");
  assert.equal(next.source_page, "/");
  assert.equal(next.utm_source, "reddit");
}

{
  const sessionStorage = new MemoryStorage();
  const first = context("https://productcsvfixer.com/", { sessionStorage });
  assert.equal(first.utm_source, undefined);

  const later = context("https://productcsvfixer.com/?utm_source=reddit&utm_medium=community", {
    sessionStorage,
  });
  assert.equal(later.utm_source, undefined);
  assert.equal(later.utm_medium, undefined);
  assert.equal(later.traffic_class, "direct");
}

{
  const throwingStorage = {
    getItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
  };
  const campaign = buildAnalyticsContext({
    href: "https://productcsvfixer.com/?utm_source=reddit&utm_medium=community&utm_campaign=launch",
    referrer: "",
    userAgent: "Mozilla/5.0",
    webdriver: false,
    isDevelopment: false,
    localStorage: throwingStorage,
    sessionStorage: throwingStorage,
  });
  assert.equal(campaign.traffic_class, "community_referral");
  assert.equal(campaign.utm_source, "reddit");
  assert.equal(campaign.utm_medium, "community");
  assert.equal(campaign.utm_campaign, "launch");
}

{
  const sessionStorage = new MemoryStorage();
  sessionStorage.setItem("productCsvFixer:utm_medium", "community");
  const campaign = context("https://productcsvfixer.com/?utm_source=google", { sessionStorage });
  assert.equal(campaign.utm_source, "google");
  assert.equal(campaign.utm_medium, undefined);
  assert.equal(campaign.traffic_class, "campaign");
}

{
  const sessionStorage = new MemoryStorage();
  sessionStorage.setItem(
    "productCsvFixerAttribution",
    JSON.stringify({
      utm_source: "merchant@example.com",
      utm_medium: "community",
      utm_campaign: "secret-token-value",
    }),
  );
  const restored = context("https://productcsvfixer.com/", { sessionStorage });
  assert.equal(restored.utm_source, undefined);
  assert.equal(restored.utm_medium, "community");
  assert.equal(restored.utm_campaign, undefined);
  assert.equal(restored.traffic_class, "community_referral");
}

{
  class PartialFailureStorage extends MemoryStorage {
    override setItem(key: string, value: string) {
      if (key === "productCsvFixer:utm_source") {
        throw new DOMException("partial write", "QuotaExceededError");
      }
      super.setItem(key, value);
    }
  }

  const sessionStorage = new PartialFailureStorage();
  const href =
    "https://productcsvfixer.com/?utm_source=reddit&utm_medium=community&utm_campaign=launch";
  const first = context(href, { sessionStorage });
  const repeated = context(href, { sessionStorage });
  assert.equal(first.utm_source, "reddit");
  assert.equal(repeated.utm_source, "reddit");
  assert.equal(repeated.utm_medium, "community");
  assert.equal(repeated.utm_campaign, "launch");
}

{
  const sessionStorage = new MemoryStorage();
  assert.equal(resolveWorkflowSource({ source_type: "sample" }, sessionStorage), "sample");
  assert.equal(resolveWorkflowSource({}, sessionStorage), "sample");
  assert.equal(
    resolveWorkflowSource({ source_type: "user_upload" }, sessionStorage),
    "user_upload",
  );
  assert.equal(resolveWorkflowSource({}, sessionStorage), "user_upload");
  assert.equal(resolveWorkflowSource({ source_type: "unknown" }, sessionStorage), "user_upload");
}

{
  const sessionStorage = new MemoryStorage();
  assert.deepEqual(
    enrichWorkflowProperties({ source_type: "unknown", row_count: 3 }, sessionStorage),
    {
      row_count: 3,
    },
  );
  assert.deepEqual(enrichWorkflowProperties({ source_type: "sample" }, sessionStorage), {
    source_type: "sample",
  });
  assert.deepEqual(enrichWorkflowProperties({ row_count: 3 }, sessionStorage), {
    row_count: 3,
    source_type: "sample",
  });
}

{
  const fallback = safeBrowserStorage(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  assert.equal(fallback.getItem("anything"), null);
  assert.doesNotThrow(() => fallback.setItem("anything", "value"));
  assert.doesNotThrow(() => fallback.removeItem("anything"));
}

{
  const sanitized = sanitizeAnalyticsCapture({
    event: "$pageview",
    properties: {
      $current_url: "https://productcsvfixer.com/path?token=secret#private",
      $referrer: "https://example.com/source?email=merchant@example.com",
      $initial_utm_source: "merchant@example.com / private",
      utm_campaign: "launch email=merchant@example.com",
      utm_term: "thisIsASecretTokenValue1234567890",
      ordinary_property: "kept",
    },
  });
  assert.deepEqual(sanitized?.properties, {
    $current_url: "https://productcsvfixer.com/path",
    $referrer: "https://example.com/source",
    ordinary_property: "kept",
  });
}

console.log("Analytics traffic context regression tests passed");
