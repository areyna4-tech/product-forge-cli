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
  title: ["title", "product name", "item name", "name"],
  sku: ["sku", "product code", "item code", "style number"],
  description: ["description", "long description", "details", "body"],
  price: ["price", "retail price", "sale price", "regular price"],
  compareAtPrice: ["compare at price", "msrp", "list price", "compare price"],
  cost: ["cost", "unit cost", "wholesale price"],
  category: ["category", "collection", "department"],
  vendor: ["vendor", "supplier", "manufacturer"],
  brand: ["brand", "brand name"],
  quantity: ["quantity", "qty", "stock", "inventory"],
  imageUrl: ["image", "image url", "main image", "photo"],
  weight: ["weight", "product weight"],
  barcode: ["barcode", "upc", "ean", "gtin"],
  option1Value: ["color", "colour", "option 1", "variant color"],
  option2Value: ["size", "option 2", "variant size"],
  tags: ["tags", "keywords", "labels"],
  productType: ["type", "product type"],
  handle: ["handle", "slug", "url key"],
};

export const REQUIRED_FIELDS: (keyof ProductRecord)[] = ["title", "sku", "price"];
export const ALL_DEST_FIELDS: (keyof ProductRecord)[] = [
  "title", "sku", "price",
  "handle", "description", "vendor", "brand", "category", "productType",
  "tags", "compareAtPrice", "cost", "quantity", "weight", "barcode",
  "imageUrl", "additionalImageUrls",
  "option1Name", "option1Value", "option2Name", "option2Value", "option3Name", "option3Value",
  "isActive", "seoTitle", "seoDescription",
];

export const TRANSFORM_OPTIONS: TransformRule[] = [
  "none", "trim", "lowercase", "uppercase", "title_case", "slugify",
  "currency_to_number", "integer", "decimal_2", "split_comma", "url_clean", "boolean_active",
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
  const s = String(value).replace(/[^0-9.\-]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function parseInteger(value: string): number | null {
  if (value == null) return null;
  const s = String(value).replace(/[^0-9\-]/g, "");
  if (!s || s === "-") return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
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
    case "kg": return Math.round(weight * 1000);
    case "g": return Math.round(weight);
    case "lb": return Math.round(weight * 453.592);
    case "oz": return Math.round(weight * 28.3495);
    default: return Math.round(weight);
  }
}

export function applyTransform(value: string, transform: TransformRule): any {
  const v = value == null ? "" : String(value);
  switch (transform) {
    case "none": return v;
    case "trim": return v.trim();
    case "lowercase": return v.trim().toLowerCase();
    case "uppercase": return v.trim().toUpperCase();
    case "title_case": return toTitleCase(v);
    case "slugify": return slugify(v);
    case "currency_to_number": return parseCurrency(v);
    case "integer": return parseInteger(v);
    case "decimal_2": {
      const n = parseCurrency(v);
      return n == null ? null : Math.round(n * 100) / 100;
    }
    case "split_comma": {
      const arr = v.split(",").map((x) => x.trim()).filter(Boolean);
      return Array.from(new Set(arr));
    }
    case "url_clean": return v.trim();
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
    title: "", handle: "", sku: "", description: "", vendor: "", brand: "",
    category: "", productType: "", tags: [], price: null, compareAtPrice: null,
    cost: null, currency: "", quantity: null, stockStatus: "unknown",
    weight: null, weightUnit: "", barcode: "", upc: "", imageUrl: "",
    additionalImageUrls: [], option1Name: "", option1Value: "", option2Name: "",
    option2Value: "", option3Name: "", option3Value: "", isActive: true,
    seoTitle: "", seoDescription: "", rawSource: raw, validationErrors: [],
  };
}

export function transformRows(
  sourceRows: Record<string, string>[],
  mappings: ColumnMapping[],
  settings: MapperSettings,
): ProductRecord[] {
  const rows = settings.removeBlankRows
    ? sourceRows.filter((r) => Object.values(r).some((v) => v && String(v).trim() !== ""))
    : sourceRows;

  return rows.map((raw, i) => {
    const p = emptyProduct(i + 1, raw);
    for (const m of mappings) {
      if (!m.sourceColumn || !m.destinationField) continue;
      const sv = raw[m.sourceColumn] ?? "";
      const tv = applyTransform(sv, m.transform);
      (p as any)[m.destinationField] = tv;
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

    // Stock
    if (p.quantity == null) p.stockStatus = "unknown";
    else if (p.quantity > 0) p.stockStatus = "in_stock";
    else p.stockStatus = "out_of_stock";

    // Tags normalization
    if (typeof p.tags === "string") {
      p.tags = (p.tags as unknown as string)
        .split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (Array.isArray(p.tags)) {
      p.tags = Array.from(new Set(p.tags.map((t) => String(t).trim()).filter(Boolean)));
    } else {
      p.tags = [];
    }

    if (typeof p.additionalImageUrls === "string") {
      p.additionalImageUrls = (p.additionalImageUrls as unknown as string)
        .split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (!Array.isArray(p.additionalImageUrls)) p.additionalImageUrls = [];

    // Force strings on identifiers
    p.sku = p.sku ? String(p.sku) : "";
    p.barcode = p.barcode ? String(p.barcode) : "";
    p.upc = p.upc ? String(p.upc) : "";

    return p;
  });
}

export function validateProducts(products: ProductRecord[], settings: MapperSettings): ProductRecord[] {
  const skuCounts = new Map<string, number>();
  for (const p of products) {
    if (p.sku) skuCounts.set(p.sku, (skuCounts.get(p.sku) || 0) + 1);
  }
  return products.map((p) => {
    const errs: ValidationError[] = [];
    if (!p.title || !String(p.title).trim()) errs.push({ field: "title", severity: "error", message: "Title is required" });
    if (!p.sku || !String(p.sku).trim()) errs.push({ field: "sku", severity: "error", message: "SKU is required" });
    if (p.price == null || isNaN(p.price as number)) errs.push({ field: "price", severity: "error", message: "Price is invalid or missing" });
    else if ((p.price as number) <= 0) errs.push({ field: "price", severity: "warning", message: "Price is zero or negative" });
    if (p.compareAtPrice != null && p.price != null && p.compareAtPrice < p.price)
      errs.push({ field: "compareAtPrice", severity: "warning", message: "Compare at price is less than price" });
    if (p.cost != null && p.price != null && p.cost > p.price)
      errs.push({ field: "cost", severity: "warning", message: "Cost exceeds price" });
    if (p.quantity != null && p.quantity < 0)
      errs.push({ field: "quantity", severity: "warning", message: "Negative quantity" });
    if (p.imageUrl && !isValidUrl(p.imageUrl))
      errs.push({ field: "imageUrl", severity: "warning", message: "Invalid image URL" });
    if (p.barcode && /[a-zA-Z]/.test(p.barcode))
      errs.push({ field: "barcode", severity: "warning", message: "Barcode contains letters" });
    if (settings.warnDuplicateSkus && p.sku && (skuCounts.get(p.sku) || 0) > 1)
      errs.push({ field: "sku", severity: "warning", message: "Duplicate SKU" });
    return { ...p, validationErrors: errs };
  });
}

export function summarize(products: ProductRecord[]): ValidationSummary {
  let exportable = 0, blocked = 0, warn = 0;
  let dupSku = 0, missingReq = 0, badPrice = 0, badImg = 0;
  for (const p of products) {
    const hasErr = p.validationErrors.some((e) => e.severity === "error");
    const hasWarn = p.validationErrors.some((e) => e.severity === "warning");
    if (hasErr) blocked++; else exportable++;
    if (hasWarn) warn++;
    for (const e of p.validationErrors) {
      if (e.severity === "error" && (e.field === "title" || e.field === "sku" || e.field === "price")) missingReq++;
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
    "Title": p.title,
    "Handle": p.handle,
    "SKU": p.sku,
    "Description": p.description,
    "Vendor": p.vendor,
    "Brand": p.brand,
    "Category": p.category,
    "Tags": p.tags.join(", "),
    "Price": formatMoney(p.price),
    "Compare At Price": formatMoney(p.compareAtPrice),
    "Cost": formatMoney(p.cost),
    "Quantity": p.quantity ?? "",
    "Stock Status": p.stockStatus,
    "Weight": p.weight ?? "",
    "Weight Unit": p.weightUnit,
    "Barcode": p.barcode || p.upc,
    "Image URL": p.imageUrl,
    "Additional Image URLs": p.additionalImageUrls.join(", "),
    "Option 1 Name": p.option1Name,
    "Option 1 Value": p.option1Value,
    "Option 2 Name": p.option2Name,
    "Option 2 Value": p.option2Value,
    "Option 3 Name": p.option3Name,
    "Option 3 Value": p.option3Value,
    "Active": p.isActive ? "TRUE" : "FALSE",
    "SEO Title": p.seoTitle,
    "SEO Description": p.seoDescription,
  }));
}

export function buildShopifyRows(products: ProductRecord[]): Record<string, any>[] {
  return products.map((p) => ({
    "Handle": p.handle,
    "Title": p.title,
    "Body (HTML)": p.description,
    "Vendor": p.vendor || p.brand,
    "Product Category": p.category,
    "Type": p.productType || p.category,
    "Tags": p.tags.join(", "),
    "Published": p.isActive ? "TRUE" : "FALSE",
    "Option1 Name": p.option1Name || "Title",
    "Option1 Value": p.option1Value || "Default Title",
    "Option2 Name": p.option2Name,
    "Option2 Value": p.option2Value,
    "Option3 Name": p.option3Name,
    "Option3 Value": p.option3Value,
    "Variant SKU": p.sku,
    "Variant Grams": convertWeightToGrams(p.weight, p.weightUnit || "lb"),
    "Variant Inventory Tracker": "shopify",
    "Variant Inventory Qty": p.quantity ?? 0,
    "Variant Inventory Policy": "deny",
    "Variant Fulfillment Service": "manual",
    "Variant Price": formatMoney(p.price),
    "Variant Compare At Price": formatMoney(p.compareAtPrice),
    "Variant Requires Shipping": "TRUE",
    "Variant Taxable": "TRUE",
    "Variant Barcode": p.barcode || p.upc,
    "Image Src": p.imageUrl,
    "Image Position": "1",
    "Image Alt Text": p.title,
    "Gift Card": "FALSE",
    "SEO Title": p.seoTitle || p.title,
    "SEO Description": p.seoDescription || (p.description || "").slice(0, 160),
    "Status": p.isActive ? "active" : "draft",
  }));
}

export function buildWooCommerceRows(products: ProductRecord[]): Record<string, any>[] {
  return products.map((p) => ({
    "Type": (p.option1Value || p.option2Value) ? "variable" : "simple",
    "SKU": p.sku,
    "Name": p.title,
    "Published": p.isActive ? "1" : "0",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Short description": p.seoDescription || (p.description || "").slice(0, 160),
    "Description": p.description,
    "Date sale price starts": "",
    "Date sale price ends": "",
    "Tax status": "taxable",
    "Tax class": "",
    "In stock?": p.stockStatus === "in_stock" ? "1" : "0",
    "Stock": p.quantity ?? 0,
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Weight": p.weight ?? "",
    "Length": "",
    "Width": "",
    "Height": "",
    "Allow customer reviews?": "1",
    "Purchase note": "",
    "Sale price": "",
    "Regular price": formatMoney(p.price),
    "Categories": p.category,
    "Tags": p.tags.join(", "),
    "Shipping class": "",
    "Images": [p.imageUrl, ...p.additionalImageUrls].filter(Boolean).join(", "),
    "Download limit": "",
    "Download expiry days": "",
    "Parent": "",
    "Grouped products": "",
    "Upsells": "",
    "Cross-sells": "",
    "External URL": "",
    "Button text": "",
    "Position": "0",
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
