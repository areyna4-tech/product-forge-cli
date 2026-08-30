export type ExportTemplate = "generic" | "shopify" | "woocommerce";

export type TransformRule =
  | "none"
  | "trim"
  | "lowercase"
  | "uppercase"
  | "title_case"
  | "slugify"
  | "currency_to_number"
  | "integer"
  | "decimal_2"
  | "split_comma"
  | "url_clean"
  | "boolean_active";

export type ValidationError = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

export type ProductRecord = {
  sourceRowId: number;
  title: string;
  handle: string;
  sku: string;
  description: string;
  vendor: string;
  brand: string;
  category: string;
  productType: string;
  tags: string[];
  price: number | null;
  compareAtPrice: number | null;
  cost: number | null;
  currency: string;
  quantity: number | null;
  inventoryPolicy: string;
  stockStatus: "in_stock" | "out_of_stock" | "backorder" | "unknown";
  weight: number | null;
  weightUnit: "g" | "kg" | "lb" | "oz" | "";
  barcode: string;
  upc: string;
  imageUrl: string;
  additionalImageUrls: string[];
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
  option3Name: string;
  option3Value: string;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  rawSource: Record<string, string>;
  validationErrors: ValidationError[];
};

export type ColumnMapping = {
  sourceColumn: string;
  destinationField: keyof ProductRecord;
  transform: TransformRule;
};

export type MapperSettings = {
  defaultCurrency: string;
  defaultVendor: string;
  defaultWeightUnit: "g" | "kg" | "lb" | "oz";
  titleCaseTitles: boolean;
  uppercaseSkus: boolean;
  generateHandles: boolean;
  fallbackDescriptionFromTitle: boolean;
  removeBlankRows: boolean;
  warnDuplicateSkus: boolean;
};

export type ValidationSummary = {
  totalRows: number;
  exportableRows: number;
  blockedRows: number;
  warningRows: number;
  duplicateSkuIssues: number;
  missingRequiredIssues: number;
  invalidPriceIssues: number;
  invalidImageUrlIssues: number;
};

export type CsvParseIssue = {
  code?: string;
  message: string;
  row?: number;
};

export function formatMoney(n: number | null | undefined): string {
  if (n == null || typeof n !== "number" || isNaN(n)) return "";
  return (Math.round(n * 100) / 100).toFixed(2);
}

export const defaultSettings: MapperSettings = {
  defaultCurrency: "USD",
  defaultVendor: "",
  defaultWeightUnit: "lb",
  titleCaseTitles: false,
  uppercaseSkus: true,
  generateHandles: true,
  fallbackDescriptionFromTitle: true,
  removeBlankRows: true,
  warnDuplicateSkus: true,
};

export const fieldAliases: Record<string, string[]> = {
  title: ["title", "product title", "product name", "item name", "name"],
  sku: ["sku", "variant sku", "product sku", "product code", "item code", "style number"],
  description: ["description", "body html", "long description", "details", "body"],
  price: ["price", "variant price", "retail price", "sale price", "regular price"],
  compareAtPrice: [
    "compare at price",
    "variant compare at price",
    "msrp",
    "list price",
    "compare price",
  ],
  cost: ["cost", "cost per item", "unit cost", "wholesale price"],
  category: ["category", "product category", "department"],
  vendor: ["vendor", "supplier", "manufacturer"],
  brand: ["brand", "brand name"],
  quantity: [
    "quantity",
    "qty",
    "stock",
    "inventory",
    "variant inventory qty",
    "inventory quantity",
  ],
  inventoryPolicy: [
    "variant inventory policy",
    "continue selling when out of stock",
    "inventory policy",
  ],
  imageUrl: ["image", "image url", "image src", "product image url", "main image", "photo"],
  weight: ["weight", "product weight", "variant grams", "weight value grams"],
  barcode: ["barcode", "variant barcode", "upc", "ean", "gtin"],
  option1Name: ["option1 name", "option 1 name"],
  option1Value: ["option1 value", "option 1 value", "color", "colour", "option 1", "variant color"],
  option2Name: ["option2 name", "option 2 name"],
  option2Value: ["option2 value", "option 2 value", "size", "option 2", "variant size"],
  option3Name: ["option3 name", "option 3 name"],
  option3Value: ["option3 value", "option 3 value"],
  tags: ["tags", "keywords", "labels"],
  productType: ["type", "product type"],
  handle: ["handle", "url handle", "slug", "url key"],
};

export const REQUIRED_FIELDS: (keyof ProductRecord)[] = ["title"];
export const ALL_DEST_FIELDS: (keyof ProductRecord)[] = [
  "title",
  "sku",
  "price",
  "handle",
  "description",
  "vendor",
  "brand",
  "category",
  "productType",
  "tags",
  "compareAtPrice",
  "cost",
  "quantity",
  "inventoryPolicy",
  "weight",
  "barcode",
  "imageUrl",
  "additionalImageUrls",
  "option1Name",
  "option1Value",
  "option2Name",
  "option2Value",
  "option3Name",
  "option3Value",
  "isActive",
  "seoTitle",
  "seoDescription",
];

export const TRANSFORM_OPTIONS: TransformRule[] = [
  "none",
  "trim",
  "lowercase",
  "uppercase",
  "title_case",
  "slugify",
  "currency_to_number",
  "integer",
  "decimal_2",
  "split_comma",
  "url_clean",
  "boolean_active",
];

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

export function slugify(value: string): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toTitleCase(value: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseCurrency(value: string): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  let stripped = raw.replace(/^[A-Za-z]{3}\s+/, "").replace(/\s+[A-Za-z]{3}$/, "");
  if (/[A-Za-z]/.test(stripped)) return null;
  stripped = stripped.replace(/^[^0-9,.-]+/, "").replace(/[^0-9,.-]+$/, "");
  if (!/\d/.test(stripped) || !/^-?[0-9.,]+$/.test(stripped)) return null;

  const sign = stripped.startsWith("-") ? -1 : 1;
  const s = stripped.replace(/^-/, "");
  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount = (s.match(/\./g) ?? []).length;
  let normalized: string | null = null;

  if (commaCount && dotCount) {
    const decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    const decimalIndex = s.lastIndexOf(decimal);
    const integerPart = s.slice(0, decimalIndex);
    const fraction = s.slice(decimalIndex + 1);
    const integerGroups = integerPart.split(thousands);
    const validThousands =
      integerGroups.length > 1 &&
      /^\d{1,3}$/.test(integerGroups[0]) &&
      integerGroups.slice(1).every((group) => /^\d{3}$/.test(group));
    if (!validThousands || !/^\d{1,2}$/.test(fraction)) return null;
    normalized = `${integerGroups.join("")}.${fraction}`;
  } else if (commaCount || dotCount) {
    const separator = commaCount ? "," : ".";
    const parts = s.split(separator);
    if (parts.some((part) => !/^\d+$/.test(part))) return null;
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else if (
      /^\d{1,3}$/.test(parts[0]) &&
      parts.length >= 2 &&
      parts.slice(1).every((group) => /^\d{3}$/.test(group))
    ) {
      normalized = parts.join("");
    } else {
      return null;
    }
  } else if (/^\d+$/.test(s)) {
    normalized = s;
  }

  if (!normalized) return null;
  const n = Number(normalized) * sign;
  return Number.isFinite(n) ? n : null;
}

export function parseInteger(value: string): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

export function firstBlockingCsvParseError(
  errors: CsvParseIssue[],
  rows: Record<string, string>[],
): string | null {
  for (const error of errors) {
    if (error.code === "UndetectableDelimiter") continue;
    const row = error.row == null ? undefined : rows[error.row];
    const isRetainedBlankRow =
      error.code === "TooFewFields" &&
      row != null &&
      Object.values(row).every((value) => value == null || String(value).trim() === "");
    if (!isRetainedBlankRow) return error.message;
  }
  return null;
}

export function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function convertWeightToGrams(weight: number | null, unit: string): number | "" {
  if (weight == null || isNaN(weight)) return "";
  switch (unit) {
    case "kg":
      return Math.round(weight * 1000);
    case "g":
      return Math.round(weight);
    case "lb":
      return Math.round(weight * 453.592);
    case "oz":
      return Math.round(weight * 28.3495);
    default:
      return Math.round(weight);
  }
}

export function applyTransform(value: string, transform: TransformRule): any {
  const v = value == null ? "" : String(value);
  switch (transform) {
    case "none":
      return v;
    case "trim":
      return v.trim();
    case "lowercase":
      return v.trim().toLowerCase();
    case "uppercase":
      return v.trim().toUpperCase();
    case "title_case":
      return toTitleCase(v);
    case "slugify":
      return slugify(v);
    case "currency_to_number":
      return parseCurrency(v);
    case "integer":
      return parseInteger(v);
    case "decimal_2": {
      const n = parseCurrency(v);
      return n == null ? null : Math.round(n * 100) / 100;
    }
    case "split_comma": {
      const arr = v
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      return Array.from(new Set(arr));
    }
    case "url_clean":
      return v.trim();
    case "boolean_active": {
      const s = v.trim().toLowerCase();
      if (!s) return true;
      return ["active", "yes", "true", "1", "published", "enabled"].includes(s);
    }
  }
}

// Default transform suggestion per destination field
export function defaultTransformFor(field: keyof ProductRecord): TransformRule {
  switch (field) {
    case "price":
    case "compareAtPrice":
    case "cost":
      return "currency_to_number";
    case "quantity":
      return "integer";
    case "weight":
      return "decimal_2";
    case "tags":
    case "additionalImageUrls":
      return "split_comma";
    case "handle":
      return "slugify";
    case "imageUrl":
      return "url_clean";
    case "isActive":
      return "boolean_active";
    case "sku":
    case "barcode":
    case "upc":
      return "trim";
    default:
      return "trim";
  }
}

export function autoMapHeaders(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const used = new Set<string>();
  for (const field of ALL_DEST_FIELDS) {
    const aliases = fieldAliases[field as string];
    if (!aliases) continue;
    for (const h of headers) {
      if (used.has(h)) continue;
      const n = normalizeHeader(h);
      if (aliases.includes(n)) {
        mappings.push({
          sourceColumn: h,
          destinationField: field,
          transform: defaultTransformFor(field),
        });
        used.add(h);
        break;
      }
    }
  }
  return mappings;
}

function emptyProduct(rowId: number, raw: Record<string, string>): ProductRecord {
  return {
    sourceRowId: rowId,
    title: "",
    handle: "",
    sku: "",
    description: "",
    vendor: "",
    brand: "",
    category: "",
    productType: "",
    tags: [],
    price: null,
    compareAtPrice: null,
    cost: null,
    currency: "",
    quantity: null,
    inventoryPolicy: "",
    stockStatus: "unknown",
    weight: null,
    weightUnit: "",
    barcode: "",
    upc: "",
    imageUrl: "",
    additionalImageUrls: [],
    option1Name: "",
    option1Value: "",
    option2Name: "",
    option2Value: "",
    option3Name: "",
    option3Value: "",
    isActive: true,
    seoTitle: "",
    seoDescription: "",
    rawSource: raw,
    validationErrors: [],
  };
}

export function transformRows(
  sourceRows: Record<string, string>[],
  mappings: ColumnMapping[],
  settings: MapperSettings,
): ProductRecord[] {
  const indexedRows = sourceRows.map((raw, index) => ({ raw, sourceRowId: index + 1 }));
  const rows = settings.removeBlankRows
    ? indexedRows.filter(({ raw }) => Object.values(raw).some((v) => v && String(v).trim() !== ""))
    : indexedRows;

  return rows.map(({ raw, sourceRowId }) => {
    const p = emptyProduct(sourceRowId, raw);
    for (const m of mappings) {
      if (!m.sourceColumn || !m.destinationField) continue;
      const sv = raw[m.sourceColumn] ?? "";
      const tv = applyTransform(sv, m.transform);
      (p as any)[m.destinationField] =
        ["price", "compareAtPrice", "cost", "quantity", "weight"].includes(m.destinationField) &&
        String(sv).trim() &&
        tv == null
          ? Number.NaN
          : tv;
      if (
        m.destinationField === "weight" &&
        ["variant grams", "weight value grams"].includes(normalizeHeader(m.sourceColumn))
      ) {
        p.weightUnit = "g";
      }
    }

    if (settings.titleCaseTitles && p.title) p.title = toTitleCase(p.title);
    if (settings.uppercaseSkus && p.sku) p.sku = String(p.sku).toUpperCase();
    if (settings.generateHandles && !p.handle && p.title) p.handle = slugify(p.title);
    if (settings.fallbackDescriptionFromTitle && !p.description && p.title) p.description = p.title;
    if (!p.vendor) p.vendor = settings.defaultVendor;
    if (!p.currency) p.currency = settings.defaultCurrency;
    if (!p.weightUnit) p.weightUnit = settings.defaultWeightUnit;

    // Normalize numbers
    if (typeof p.price === "string") p.price = parseCurrency(p.price);
    if (typeof p.compareAtPrice === "string") p.compareAtPrice = parseCurrency(p.compareAtPrice);
    if (typeof p.cost === "string") p.cost = parseCurrency(p.cost);
    if (typeof p.quantity === "string") p.quantity = parseInteger(p.quantity);
    if (typeof p.weight === "string") p.weight = parseCurrency(p.weight);
    for (const mapping of mappings) {
      if (
        !["price", "compareAtPrice", "cost", "quantity", "weight"].includes(
          mapping.destinationField,
        )
      )
        continue;
      const sourceValue = raw[mapping.sourceColumn];
      if (!String(sourceValue ?? "").trim()) continue;
      if (mapping.destinationField === "price" && p.price == null) p.price = Number.NaN;
      else if (mapping.destinationField === "compareAtPrice" && p.compareAtPrice == null)
        p.compareAtPrice = Number.NaN;
      else if (mapping.destinationField === "cost" && p.cost == null) p.cost = Number.NaN;
      else if (mapping.destinationField === "quantity" && p.quantity == null)
        p.quantity = Number.NaN;
      else if (mapping.destinationField === "weight" && p.weight == null) p.weight = Number.NaN;
    }

    // Stock
    if (p.quantity == null) p.stockStatus = "unknown";
    else if (p.quantity > 0) p.stockStatus = "in_stock";
    else p.stockStatus = "out_of_stock";

    // Tags normalization
    if (typeof p.tags === "string") {
      p.tags = (p.tags as unknown as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (Array.isArray(p.tags)) {
      p.tags = Array.from(new Set(p.tags.map((t) => String(t).trim()).filter(Boolean)));
    } else {
      p.tags = [];
    }

    if (typeof p.additionalImageUrls === "string") {
      p.additionalImageUrls = (p.additionalImageUrls as unknown as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(p.additionalImageUrls)) p.additionalImageUrls = [];

    // Force strings on identifiers
    p.sku = p.sku ? String(p.sku) : "";
    p.barcode = p.barcode ? String(p.barcode) : "";
    p.upc = p.upc ? String(p.upc) : "";

    return p;
  });
}

function isPureImageRow(p: ProductRecord): boolean {
  return (
    !p.title &&
    Boolean(p.handle) &&
    Boolean(p.imageUrl) &&
    !p.sku &&
    p.price == null &&
    p.compareAtPrice == null &&
    p.cost == null &&
    p.quantity == null &&
    !p.inventoryPolicy &&
    p.weight == null &&
    !p.barcode &&
    !p.upc &&
    !p.option1Name &&
    !p.option1Value &&
    !p.option2Name &&
    !p.option2Value &&
    !p.option3Name &&
    !p.option3Value
  );
}

function variantOptionKey(p: ProductRecord): string {
  return [p.option1Value, p.option2Value, p.option3Value]
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
    .join("\u0000");
}

export function validateProducts(
  products: ProductRecord[],
  settings: MapperSettings,
): ProductRecord[] {
  const skuCounts = new Map<string, number>();
  for (const p of products) {
    if (p.sku) skuCounts.set(p.sku, (skuCounts.get(p.sku) || 0) + 1);
  }

  const metadata: { handle: string; continuation: boolean; imageOnly: boolean }[] = [];
  const metadataHandles = new Set<string>();
  const parentIndexByHandle = new Map<string, number>();
  const variantIndexesByHandle = new Map<string, number[]>();
  products.forEach((p, index) => {
    const handle = String(p.handle || "").trim();
    const title = String(p.title || "").trim();
    const continuation = !title && Boolean(handle) && metadataHandles.has(handle);
    const imageOnly = continuation && isPureImageRow(p);
    metadata.push({ handle, continuation, imageOnly });
    if (handle && !imageOnly) {
      const indexes = variantIndexesByHandle.get(handle) || [];
      indexes.push(index);
      variantIndexesByHandle.set(handle, indexes);
    }
    if (title && handle) {
      metadataHandles.add(handle);
      if (!parentIndexByHandle.has(handle)) parentIndexByHandle.set(handle, index);
    }
  });

  const optionCountsByHandle = new Map<string, Map<string, number>>();
  for (const [handle, indexes] of variantIndexesByHandle) {
    if (indexes.length < 2) continue;
    const optionCounts = new Map<string, number>();
    for (const index of indexes) {
      const key = variantOptionKey(products[index]);
      optionCounts.set(key, (optionCounts.get(key) || 0) + 1);
    }
    optionCountsByHandle.set(handle, optionCounts);
  }

  const validated = products.map((p, index) => {
    const errs: ValidationError[] = [];
    const { handle, continuation, imageOnly } = metadata[index];
    const title = String(p.title || "").trim();

    if (!title && !continuation)
      errs.push({ field: "title", severity: "error", message: "Title is required" });
    const fulfillmentService = rawSourceValue(p, [
      "Fulfillment service",
      "Variant Fulfillment Service",
    ]).toLowerCase();
    if (!imageOnly && (!p.sku || !String(p.sku).trim())) {
      if (fulfillmentService && fulfillmentService !== "manual")
        errs.push({
          field: "sku",
          severity: "error",
          message: "SKU is required for a custom fulfillment service",
        });
      else errs.push({ field: "sku", severity: "warning", message: "SKU is blank" });
    }
    if (!imageOnly) {
      if (p.price == null)
        errs.push({
          field: "price",
          severity: "warning",
          message: "Price is blank; Shopify defaults to 0.00",
        });
      else if (isNaN(p.price as number))
        errs.push({
          field: "price",
          severity: "error",
          message: "Price is invalid or missing",
        });
      else if ((p.price as number) <= 0)
        errs.push({ field: "price", severity: "warning", message: "Price is zero or negative" });
    }
    if (p.compareAtPrice != null && isNaN(p.compareAtPrice))
      errs.push({
        field: "compareAtPrice",
        severity: "error",
        message: "Compare-at price is invalid",
      });
    else if (p.compareAtPrice != null && p.price != null && p.compareAtPrice < p.price)
      errs.push({
        field: "compareAtPrice",
        severity: "warning",
        message: "Compare at price is less than price",
      });
    if (p.cost != null && isNaN(p.cost))
      errs.push({ field: "cost", severity: "error", message: "Cost is invalid" });
    else if (p.cost != null && p.price != null && p.cost > p.price)
      errs.push({ field: "cost", severity: "warning", message: "Cost exceeds price" });
    if (p.quantity != null && isNaN(p.quantity))
      errs.push({ field: "quantity", severity: "error", message: "Inventory quantity is invalid" });
    else if (p.quantity != null && p.quantity < 0)
      errs.push({ field: "quantity", severity: "warning", message: "Negative quantity" });
    if (p.weight != null && isNaN(p.weight))
      errs.push({ field: "weight", severity: "error", message: "Weight is invalid" });
    if (p.imageUrl && !isValidUrl(p.imageUrl))
      errs.push({ field: "imageUrl", severity: "warning", message: "Invalid image URL" });
    if (p.inventoryPolicy && !["deny", "continue"].includes(p.inventoryPolicy.toLowerCase()))
      errs.push({
        field: "inventoryPolicy",
        severity: "error",
        message: "Inventory policy must be deny or continue",
      });
    const booleanSourceFields: Array<{
      aliases: string[];
      field: string;
      label: string;
    }> = [
      {
        aliases: ["Published on online store", "Published"],
        field: "published",
        label: "Published",
      },
      {
        aliases: ["Requires shipping", "Variant Requires Shipping"],
        field: "requiresShipping",
        label: "Requires shipping",
      },
      { aliases: ["Charge tax", "Variant Taxable"], field: "taxable", label: "Charge tax" },
      { aliases: ["Gift card", "Gift Card"], field: "giftCard", label: "Gift card" },
    ];
    for (const sourceField of booleanSourceFields) {
      const value = rawSourceValue(p, sourceField.aliases).toLowerCase();
      if (value && !["true", "false", "yes", "no", "1", "0"].includes(value))
        errs.push({
          field: sourceField.field,
          severity: "error",
          message: `${sourceField.label} must be true or false`,
        });
    }
    const sourceStatus = rawSourceValue(p, ["Status"]).toLowerCase();
    if (sourceStatus && !["active", "draft", "archived"].includes(sourceStatus))
      errs.push({
        field: "status",
        severity: "error",
        message: "Status must be active, draft, or archived",
      });
    const variantIndexes = variantIndexesByHandle.get(handle) || [];
    if (!imageOnly && variantIndexes.length > 1) {
      const optionKey = variantOptionKey(p);
      if (!p.option1Value && !p.option2Value && !p.option3Value)
        errs.push({
          field: "option1Value",
          severity: "error",
          message: "Variant option value is required when a product has multiple variants",
        });
      else if ((optionCountsByHandle.get(handle)?.get(optionKey) || 0) > 1)
        errs.push({
          field: "option1Value",
          severity: "error",
          message: "Duplicate variant option combination",
        });
    }
    if (p.barcode && /[a-zA-Z]/.test(p.barcode))
      errs.push({ field: "barcode", severity: "warning", message: "Barcode contains letters" });
    if (settings.warnDuplicateSkus && p.sku && (skuCounts.get(p.sku) || 0) > 1)
      errs.push({ field: "sku", severity: "warning", message: "Duplicate SKU" });
    return { ...p, validationErrors: errs };
  });

  const blockedParentHandles = new Set<string>();
  for (const [handle, parentIndex] of parentIndexByHandle) {
    if (validated[parentIndex].validationErrors.some((error) => error.severity === "error")) {
      blockedParentHandles.add(handle);
    }
  }

  return validated.map((product, index) => {
    const { handle, continuation } = metadata[index];
    if (!continuation || !blockedParentHandles.has(handle)) return product;
    return {
      ...product,
      validationErrors: [
        ...product.validationErrors,
        {
          field: "title",
          severity: "error",
          message: "Parent product row is blocked",
        },
      ],
    };
  });
}

export function summarize(products: ProductRecord[]): ValidationSummary {
  let exportable = 0,
    blocked = 0,
    warn = 0;
  let dupSku = 0,
    missingReq = 0,
    badPrice = 0,
    badImg = 0;
  for (const p of products) {
    const hasErr = p.validationErrors.some((e) => e.severity === "error");
    const hasWarn = p.validationErrors.some((e) => e.severity === "warning");
    if (hasErr) blocked++;
    else exportable++;
    if (hasWarn) warn++;
    for (const e of p.validationErrors) {
      if (
        e.severity === "error" &&
        (e.field === "title" || e.field === "sku" || e.field === "price")
      )
        missingReq++;
      if (e.severity === "error" && e.field === "price") badPrice++;
      if (e.severity === "warning" && e.field === "imageUrl") badImg++;
      if (e.severity === "warning" && e.message === "Duplicate SKU") dupSku++;
    }
  }
  return {
    totalRows: products.length,
    exportableRows: exportable,
    blockedRows: blocked,
    warningRows: warn,
    duplicateSkuIssues: dupSku,
    missingRequiredIssues: missingReq,
    invalidPriceIssues: badPrice,
    invalidImageUrlIssues: badImg,
  };
}

export function buildGenericRows(products: ProductRecord[]): Record<string, any>[] {
  return products.map((p) => ({
    Title: p.title,
    Handle: p.handle,
    SKU: p.sku,
    Description: p.description,
    Vendor: p.vendor,
    Brand: p.brand,
    Category: p.category,
    Tags: p.tags.join(", "),
    Price: formatMoney(p.price),
    "Compare At Price": formatMoney(p.compareAtPrice),
    Cost: formatMoney(p.cost),
    Quantity: p.quantity ?? "",
    "Stock Status": p.stockStatus,
    Weight: p.weight ?? "",
    "Weight Unit": p.weightUnit,
    Barcode: p.barcode || p.upc,
    "Image URL": p.imageUrl,
    "Additional Image URLs": p.additionalImageUrls.join(", "),
    "Option 1 Name": p.option1Name,
    "Option 1 Value": p.option1Value,
    "Option 2 Name": p.option2Name,
    "Option 2 Value": p.option2Value,
    "Option 3 Name": p.option3Name,
    "Option 3 Value": p.option3Value,
    Active: p.isActive ? "TRUE" : "FALSE",
    "SEO Title": p.seoTitle,
    "SEO Description": p.seoDescription,
  }));
}

function rawSourceValue(product: ProductRecord, aliases: string[]): string {
  const normalizedAliases = new Set(aliases.map(normalizeHeader));
  const entry = Object.entries(product.rawSource).find(([header]) =>
    normalizedAliases.has(normalizeHeader(header)),
  );
  return entry == null ? "" : String(entry[1] ?? "").trim();
}

function shopifyBoolean(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "published", "active"].includes(normalized)) return "TRUE";
  if (["false", "no", "0", "unpublished", "draft"].includes(normalized)) return "FALSE";
  return value.trim();
}

function shopifyPassthroughFields(product: ProductRecord): Record<string, string> {
  const passthrough: Record<string, string> = {};
  for (const [header, value] of Object.entries(product.rawSource)) {
    const normalized = normalizeHeader(header);
    const canonicalHeader =
      normalized === "collection"
        ? "Collection"
        : normalized === "variant image" || normalized === "variant image url"
          ? "Variant Image"
          : normalized === "image position"
            ? "Image Position"
            : normalized === "image alt text"
              ? "Image Alt Text"
              : normalized === "weight unit for display"
                ? "Weight unit for display"
                : "";
    if (canonicalHeader) {
      passthrough[canonicalHeader] = String(value ?? "").trim();
      continue;
    }
    if (
      /^(price|compare-at price|included)\s*\/\s*.+$/i.test(header.trim()) ||
      /^google shopping\s*\/\s*.+$/i.test(header.trim()) ||
      /^(product|variant)\.metafields\./i.test(header.trim()) ||
      /^metafield:/i.test(header.trim()) ||
      /\((product|variant)\.metafields\.[^)]+\)/i.test(header.trim()) ||
      /^option[123] linkedto$/i.test(normalized)
    ) {
      passthrough[header] = String(value ?? "").trim();
    }
  }
  return passthrough;
}

export function buildShopifyRows(products: ProductRecord[]): Record<string, any>[] {
  return products.map((p) => {
    const imageOnly = isPureImageRow(p);
    if (imageOnly) {
      return {
        Handle: p.handle,
        Title: "",
        "Body (HTML)": "",
        Vendor: "",
        "Product Category": "",
        Type: "",
        Tags: "",
        Published: "",
        "Option1 Name": "",
        "Option1 Value": "",
        "Option2 Name": "",
        "Option2 Value": "",
        "Option3 Name": "",
        "Option3 Value": "",
        "Variant SKU": "",
        "Variant Grams": "",
        "Variant Inventory Tracker": "",
        "Variant Inventory Qty": "",
        "Variant Inventory Policy": "",
        "Variant Fulfillment Service": "",
        "Variant Price": "",
        "Variant Compare At Price": "",
        "Variant Requires Shipping": "",
        "Variant Taxable": "",
        "Variant Barcode": "",
        "Image Src": p.imageUrl,
        "Image Position": "",
        "Image Alt Text": "",
        "Gift Card": "",
        "SEO Title": "",
        "SEO Description": "",
        Status: "",
        ...shopifyPassthroughFields(p),
      };
    }
    const published = rawSourceValue(p, ["Published on online store", "Published"]);
    const status = rawSourceValue(p, ["Status"]);
    const inventoryTracker = rawSourceValue(p, ["Inventory tracker", "Variant Inventory Tracker"]);
    const fulfillmentService = rawSourceValue(p, [
      "Fulfillment service",
      "Variant Fulfillment Service",
    ]);
    const requiresShipping = rawSourceValue(p, ["Requires shipping", "Variant Requires Shipping"]);
    const taxable = rawSourceValue(p, ["Charge tax", "Variant Taxable"]);
    const giftCard = rawSourceValue(p, ["Gift card", "Gift Card"]);
    return {
      Handle: p.handle,
      Title: p.title,
      "Body (HTML)": p.description,
      Vendor: p.vendor || p.brand,
      "Product Category": p.category,
      Type: p.productType || p.category,
      Tags: p.tags.join(", "),
      Published: shopifyBoolean(published),
      "Option1 Name": p.option1Name || "Title",
      "Option1 Value": p.option1Value || "Default Title",
      "Option2 Name": p.option2Name,
      "Option2 Value": p.option2Value,
      "Option3 Name": p.option3Name,
      "Option3 Value": p.option3Value,
      "Variant SKU": p.sku,
      "Variant Grams": convertWeightToGrams(p.weight, p.weightUnit || "lb"),
      "Variant Inventory Tracker": inventoryTracker,
      "Variant Inventory Qty": p.quantity ?? "",
      "Variant Inventory Policy": p.inventoryPolicy.trim().toLowerCase(),
      "Variant Fulfillment Service": fulfillmentService,
      "Variant Price": formatMoney(p.price),
      "Variant Compare At Price": formatMoney(p.compareAtPrice),
      "Variant Requires Shipping": shopifyBoolean(requiresShipping),
      "Variant Taxable": shopifyBoolean(taxable),
      "Variant Barcode": p.barcode || p.upc,
      "Image Src": p.imageUrl,
      "Image Position": "1",
      "Image Alt Text": p.title,
      "Gift Card": shopifyBoolean(giftCard),
      "Cost per item": formatMoney(p.cost),
      "SEO Title": p.seoTitle || p.title,
      "SEO Description": p.seoDescription || (p.description || "").slice(0, 160),
      Status: status.trim().toLowerCase() || "active",
      ...shopifyPassthroughFields(p),
    };
  });
}

export function buildWooCommerceRows(products: ProductRecord[]): Record<string, any>[] {
  return products.map((p) => ({
    Type: p.option1Value || p.option2Value ? "variable" : "simple",
    SKU: p.sku,
    Name: p.title,
    Published: p.isActive ? "1" : "0",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Short description": p.seoDescription || (p.description || "").slice(0, 160),
    Description: p.description,
    "Date sale price starts": "",
    "Date sale price ends": "",
    "Tax status": "taxable",
    "Tax class": "",
    "In stock?": p.stockStatus === "in_stock" ? "1" : "0",
    Stock: p.quantity ?? 0,
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    Weight: p.weight ?? "",
    Length: "",
    Width: "",
    Height: "",
    "Allow customer reviews?": "1",
    "Purchase note": "",
    "Sale price": "",
    "Regular price": formatMoney(p.price),
    Categories: p.category,
    Tags: p.tags.join(", "),
    "Shipping class": "",
    Images: [p.imageUrl, ...p.additionalImageUrls].filter(Boolean).join(", "),
    "Download limit": "",
    "Download expiry days": "",
    Parent: "",
    "Grouped products": "",
    Upsells: "",
    "Cross-sells": "",
    "External URL": "",
    "Button text": "",
    Position: "0",
    "Attribute 1 name": p.option1Name,
    "Attribute 1 value(s)": p.option1Value,
    "Attribute 1 visible": p.option1Name ? "1" : "",
    "Attribute 1 global": p.option1Name ? "0" : "",
    "Attribute 2 name": p.option2Name,
    "Attribute 2 value(s)": p.option2Value,
    "Attribute 2 visible": p.option2Name ? "1" : "",
    "Attribute 2 global": p.option2Name ? "0" : "",
  }));
}

export const SAMPLE_CSV = `Item Name,Product Code,Retail Price,Qty,Brand Name,Category,Main Image,Color,Size,Description
Blue Cotton Shirt,SHIRT-001,$29.99,15,Acme Apparel,Shirts,https://example.com/blue-shirt.jpg,Blue,M,Soft cotton shirt
Red Cotton Shirt,SHIRT-002,$31.99,0,Acme Apparel,Shirts,https://example.com/red-shirt.jpg,Red,L,Soft cotton shirt
Black Leather Belt,BELT-001,$49.50,8,Urban Goods,Accessories,https://example.com/black-belt.jpg,Black,One Size,Genuine leather belt`;
