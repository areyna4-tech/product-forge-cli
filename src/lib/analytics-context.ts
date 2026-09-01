export type TrafficClass =
  | "internal_qa"
  | "suspected_bot"
  | "organic_search"
  | "community_referral"
  | "campaign"
  | "direct"
  | "referral";

export type WorkflowSource = "sample" | "user_upload";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AnalyticsContextInput {
  href: string;
  referrer: string;
  userAgent: string;
  webdriver: boolean;
  isDevelopment: boolean;
  localStorage: StorageLike;
  sessionStorage: StorageLike;
}

export interface AnalyticsContext {
  traffic_class: TrafficClass;
  is_internal_traffic: boolean;
  is_suspected_bot: boolean;
  landing_path: string;
  source_page: string;
  referrer_domain: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export const INTERNAL_QA_STORAGE_KEY = "productCsvFixerInternalQa";
const LANDING_PATH_STORAGE_KEY = "productCsvFixerLandingPath";
const WORKFLOW_SOURCE_STORAGE_KEY = "productCsvFixerWorkflowSource";
const ATTRIBUTION_STORAGE_KEY = "productCsvFixerAttribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

const SEARCH_DOMAINS = [
  "google.com",
  "google.ca",
  "bing.com",
  "duckduckgo.com",
  "search.yahoo.com",
  "ecosia.org",
  "brave.com",
];

const COMMUNITY_DOMAINS = [
  "reddit.com",
  "community.shopify.com",
  "stackoverflow.com",
  "facebook.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
];

function safeStorageGet(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(storage: StorageLike, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Analytics attribution must never interrupt the product workflow.
  }
}

function safeStorageRemove(storage: StorageLike, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Analytics attribution must never interrupt the product workflow.
  }
}

function normalizeCampaignValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    /@|(?:^|[^a-z])(?:token|secret|password|passwd|email|auth|session|jwt|api.?key)(?:[^a-z]|$)/i.test(
      trimmed,
    ) ||
    /[a-zA-Z0-9_-]{24,}/.test(trimmed)
  ) {
    return undefined;
  }
  const normalized = value
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9._~-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || undefined;
}

function hostnameFromReferrer(referrer: string): string {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function matchesDomain(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function isSuspectedBot(userAgent: string, webdriver: boolean): boolean {
  return (
    webdriver || /bot|crawler|spider|headless|lighthouse|pagespeed|pingdom|slurp/i.test(userAgent)
  );
}

function readCampaignContext(url: URL, sessionStorage: StorageLike) {
  const stored = safeStorageGet(sessionStorage, ATTRIBUTION_STORAGE_KEY);
  if (stored) {
    const campaign: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
    try {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      for (const key of UTM_KEYS) {
        const value = normalizeCampaignValue(typeof parsed[key] === "string" ? parsed[key] : null);
        if (value) campaign[key] = value;
      }
      safeStorageSet(sessionStorage, ATTRIBUTION_STORAGE_KEY, JSON.stringify(campaign));
      return campaign;
    } catch {
      // Replace malformed attribution with the current first-touch snapshot below.
    }
  }

  const campaign: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
  for (const key of UTM_KEYS) {
    const value = normalizeCampaignValue(url.searchParams.get(key));
    if (value) campaign[key] = value;
  }
  safeStorageSet(sessionStorage, ATTRIBUTION_STORAGE_KEY, JSON.stringify(campaign));
  return campaign;
}

export function buildAnalyticsContext(input: AnalyticsContextInput): AnalyticsContext {
  const url = new URL(input.href);
  const qaMarker = url.searchParams.get("pcf_qa");
  if (qaMarker === "1") safeStorageSet(input.localStorage, INTERNAL_QA_STORAGE_KEY, "true");
  if (qaMarker === "0") safeStorageRemove(input.localStorage, INTERNAL_QA_STORAGE_KEY);

  const isInternal =
    input.isDevelopment || safeStorageGet(input.localStorage, INTERNAL_QA_STORAGE_KEY) === "true";
  const bot = isSuspectedBot(input.userAgent, input.webdriver);
  const referrerDomain = hostnameFromReferrer(input.referrer);
  const campaign = readCampaignContext(url, input.sessionStorage);

  let landingPath = safeStorageGet(input.sessionStorage, LANDING_PATH_STORAGE_KEY);
  if (!landingPath) {
    landingPath = url.pathname || "/";
    safeStorageSet(input.sessionStorage, LANDING_PATH_STORAGE_KEY, landingPath);
  }

  const communityMedium = ["community", "forum", "social"].includes(
    (campaign.utm_medium || "").toLowerCase(),
  );
  const hasCampaign = UTM_KEYS.some((key) => Boolean(campaign[key]));

  let trafficClass: TrafficClass;
  if (isInternal) trafficClass = "internal_qa";
  else if (bot) trafficClass = "suspected_bot";
  else if (communityMedium || matchesDomain(referrerDomain, COMMUNITY_DOMAINS))
    trafficClass = "community_referral";
  else if (hasCampaign) trafficClass = "campaign";
  else if (matchesDomain(referrerDomain, SEARCH_DOMAINS)) trafficClass = "organic_search";
  else if (referrerDomain === "direct") trafficClass = "direct";
  else trafficClass = "referral";

  return {
    traffic_class: trafficClass,
    is_internal_traffic: isInternal,
    is_suspected_bot: bot,
    landing_path: landingPath,
    source_page: url.pathname || "/",
    referrer_domain: referrerDomain,
    ...campaign,
  };
}

export function resolveWorkflowSource(
  properties: Record<string, unknown>,
  sessionStorage: StorageLike,
): WorkflowSource | undefined {
  const explicit = properties.source_type;
  if (explicit === "sample" || explicit === "user_upload") {
    safeStorageSet(sessionStorage, WORKFLOW_SOURCE_STORAGE_KEY, explicit);
    return explicit;
  }
  const stored = safeStorageGet(sessionStorage, WORKFLOW_SOURCE_STORAGE_KEY);
  return stored === "sample" || stored === "user_upload" ? stored : undefined;
}

export function enrichWorkflowProperties(
  properties: Record<string, unknown>,
  sessionStorage: StorageLike,
): Record<string, unknown> {
  const workflowSource = resolveWorkflowSource(properties, sessionStorage);
  const { source_type: _discarded, ...rest } = properties;
  return workflowSource ? { ...rest, source_type: workflowSource } : rest;
}

const NOOP_STORAGE: StorageLike = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export function safeBrowserStorage(getter: () => StorageLike): StorageLike {
  try {
    return getter();
  } catch {
    return NOOP_STORAGE;
  }
}

interface AnalyticsCapture {
  event: string;
  properties: Record<string, unknown>;
}

const URL_PROPERTY_KEYS = [
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
] as const;

function stripUrlDetails(value: string): string | undefined {
  if (value === "$direct") return value;
  if (value.startsWith("/")) return value.split(/[?#]/, 1)[0] || "/";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

export function sanitizeAnalyticsCapture<T extends AnalyticsCapture | null>(capture: T): T {
  if (!capture) return capture;
  const properties = { ...capture.properties };
  for (const key of URL_PROPERTY_KEYS) {
    const value = properties[key];
    if (typeof value !== "string") continue;
    const sanitized = stripUrlDetails(value);
    if (sanitized) properties[key] = sanitized;
    else delete properties[key];
  }
  for (const [key, value] of Object.entries(properties)) {
    if (!/^(?:\$initial_|\$)?utm_(?:source|medium|campaign|content|term)$/.test(key)) continue;
    if (typeof value !== "string") {
      delete properties[key];
      continue;
    }
    const sanitized = normalizeCampaignValue(value);
    if (sanitized) properties[key] = sanitized;
    else delete properties[key];
  }
  return { ...capture, properties } as T;
}
