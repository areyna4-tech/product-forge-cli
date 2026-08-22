# ProductCSVFixer traffic sprint outreach pack

Purpose: seed useful, non-spam answers in places where Shopify store owners already ask for help with CSV import failures. Keep the positioning self-serve: browser-based pre-flight check, free preview, paid unlock only if they want the full report/export. Do not offer manual cleanup, emailed file workflows, or done-for-you repair.

## Rules

- Do not spam. Answer only threads where the question is directly about Shopify product CSV import errors, required columns, image URLs, SKUs, inventory policy, or failed imports.
- Lead with the fix logic, not the link.
- Disclose ProductCSVFixer plainly when linking.
- Keep it self-serve: users run their own CSV in the browser; do not ask anyone to email or send a file.
- Mention the free preview before the $9 unlock.

## Target thread themes

1. Shopify CSV import not working
2. inventory policy is not included in the list
3. duplicate SKU or duplicate handle warnings
4. Shopify CSV image URL not importing
5. Shopify product CSV required columns
6. supplier CSV to Shopify product CSV cleanup

## Answer template: Shopify CSV import not working

That usually means Shopify found a row-level blocker rather than a whole-site problem. Check the rows for blank titles or handles, invalid Variant Price values, duplicate SKUs/handles, private Image Src URLs, and inconsistent variant option columns.

A practical sequence:

1. Save a copy of the source CSV.
2. Check required product fields first: Title, Handle, Variant SKU, Variant Price, Image Src.
3. Fix one blocker category at a time.
4. Reupload only after the CSV passes a pre-flight check.

I built ProductCSVFixer for this exact self-serve pre-flight step: https://productcsvfixer.com/shopify-csv-import-not-working — it processes the CSV in the browser, gives a free preview, and only charges if you want the full validation report + Shopify-ready export.

## Answer template: inventory policy is not included in the list

The error `inventory policy is not included in the list` usually means the inventory policy column contains a value Shopify does not accept. Look for blank values, custom supplier text, inconsistent casing, or values copied from another system.

Before uploading again, check the inventory policy column plus adjacent inventory/SKU fields. The error can appear alongside duplicate SKUs or messy variant rows.

Self-serve checker: https://productcsvfixer.com/shopify-inventory-policy-csv-error

## Answer template: duplicate SKU

Duplicate SKUs can be valid in some catalog setups, but they often break inventory expectations or make a Shopify CSV import hard to review. First determine whether the duplicate is a real repeated variant or an accidental supplier placeholder.

Suggested check:

1. Sort by Variant SKU.
2. Identify blank or repeated SKUs.
3. Confirm whether each duplicate belongs to the same product/variant group.
4. Fix accidental duplicates before import.

ProductCSVFixer can preview blocker/warning categories before upload: https://productcsvfixer.com/

## Answer template: image URL error

Shopify needs image URLs it can fetch publicly. Image CSV errors usually come from private supplier portals, temporary URLs, Google Drive/Dropbox preview links, redirects, or non-image pages.

Check that each Image Src is an https URL that opens directly in a browser without login and returns an actual image file.

ProductCSVFixer checks image URL-like issues as part of a Shopify CSV pre-flight scan: https://productcsvfixer.com/shopify-csv-import-not-working

## Answer template: required columns

A Shopify CSV can have the right headers and still fail if the row values are blank, malformed, duplicated, or mapped incorrectly. Check both the required columns and the row-level values.

Useful starting points:

- Title
- Handle
- Variant SKU
- Variant Price
- Option fields
- Image Src

Checklist/template: https://productcsvfixer.com/shopify-csv-import-checklist.csv and https://productcsvfixer.com/shopify-product-csv-starter-template.csv

Self-serve validator page: https://productcsvfixer.com/shopify-csv-required-columns

## Weekly execution target

- Find 5 relevant Shopify Community or Reddit threads.
- Leave 3 high-quality answers with no link if the thread does not need one.
- Leave 2 answers with a ProductCSVFixer link only when directly relevant.
- Track any referral traffic in PostHog and GSC branded/query changes.
