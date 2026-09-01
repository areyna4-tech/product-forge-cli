# ProductCSVFixer Story 4 — controlled community referral plan

Prepared: 2026-09-01

## Objective

Generate a small amount of qualified Shopify CSV traffic without changing the current product, pricing, paywall, or analytics baseline. Answers must solve the thread's problem first; ProductCSVFixer is mentioned only when its browser-based pre-flight check is directly useful.

Day 0 begins when the first approved community answer containing a tracked ProductCSVFixer link is published. No answer may be posted under the owner's identity without final approval.

## Guardrails

- Start with two answers, not ten.
- Do not revive a resolved or saturated thread merely to add a link.
- Disclose the relationship plainly: `I built ProductCSVFixer`.
- Never ask a merchant to email, upload publicly, or send their CSV.
- Do not claim ProductCSVFixer can connect to a store, test remote image availability, compare against a live catalog, restore deleted variants, or guarantee Shopify acceptance.
- Mention the free preview before the optional $9 full report and Shopify-ready export.
- Use one source-specific `utm_content` value per linked answer.
- Never recommend a narrowed diagnostic import over an existing production handle. Require an untouched full export, the complete affected handle group, and a development store or disposable duplicate product with a unique handle.
- Keep the current homepage, $9 price, free-preview boundary, checkout structure, and validation rules unchanged during the initial observation window.

## Verified opportunity matrix

All ten Shopify Community topics were visible, open, and unarchived when checked on 2026-09-01. “Hold” means the discussion is relevant but an answer now would repeat an existing solution or add to a saturated promotional thread.

| #   | Discussion                                                                   | Last activity | Assessment                                                                                                                             | Initial action                     |
| --- | ---------------------------------------------------------------------------- | ------------: | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Fulfillment service / inventory policy error.[1]                             |    2026-05-29 | High intent, but the merchant thanked the existing responder and the thread appears resolved.                                          | Hold                               |
| 2   | Claude converting supplier PDF catalogs into Shopify products.[2]            |    2026-08-29 | Current and high intent, but already contains many detailed vendor/tool responses.                                                     | Hold; do not add another promotion |
| 3   | CSV import deleted product variants.[3]                                      |    2026-08-28 | Strong product fit, but the latest replies already cover full exports, variant identity, backups, and pre-flight limits.               | Hold; monitor for a new question   |
| 4   | `File original source missing from the product files input`.[4]              |    2026-02-24 | Unresolved after public image links and a one-record test; a structured static pre-flight is directly relevant.                        | **Candidate A**                    |
| 5   | Change prices by CSV without affecting other product data.[5]                |    2026-08-24 | High intent, but multiple recent replies already explain overwrite behavior and promote tools.                                         | Hold                               |
| 6   | Variant image column ignored during CSV import.[6]                           |    2025-09-22 | Relevant, but the long thread already contains several workarounds and ProductCSVFixer cannot verify Shopify's live image association. | Hold; no product link              |
| 7   | Bulk import about 9,000 products with color/size variants and images.[7]     |    2025-11-17 | High intent, but the merchant already received several CSV/app answers.                                                                | Hold                               |
| 8   | Import reports success but creates no products.[8]                           |    2026-03-29 | High intent, but a recent detailed troubleshooting answer already covers encoding, headers, and grouping.                              | Hold                               |
| 9   | `Inventory policy is not included in the list` despite `continue` values.[9] |    2025-06-20 | Direct fit and still unresolved; the only reply was a request for a private chat, not a public solution.                               | **Candidate B**                    |
| 10  | Field map for the Shopify product CSV template.[10]                          |    2025-08-04 | Relevant, but two public answers already point to the field map and summarize the main fields.                                         | Hold                               |

## Initial two-answer batch

### Candidate A — unresolved “File original source missing” error

Thread: https://community.shopify.com/t/file-original-source-missing-from-the-product-files-input/588637

Tracked link:

https://productcsvfixer.com/shopify-csv-import-errors?utm_source=shopify-community&utm_medium=community&utm_campaign=story4-referral&utm_content=file-original-source-missing

Proposed answer:

> Since the image URLs return 200 and the same error remains with one product, I would stop treating this as a simple broken-link problem and reduce the file by dependency group.
>
> 1. Export the affected products from Shopify and preserve that full export untouched as the recovery copy. Use the current sample template only to compare headers—not as a replacement for the exported product structure.
> 2. Keep the complete affected product group together: every row sharing the handle, including all variants and image rows. Do not reduce an existing multi-variant product to one record.
> 3. Make a separate diagnostic copy. In that copy, omit every image/file-related column you are not intentionally changing—not blank cells, the entire optional column—while preserving the handle, title, variant identity columns, SKU, price, and every row in the group.
> 4. Test the diagnostic copy in a development store if available. Otherwise use a deliberately created disposable product with a temporary unique handle; do not overwrite the existing production handle while narrowing the file.
> 5. If the safe test succeeds, add `Product image URL` or `Variant image URL` back one at a time, still using the complete product group. Save every test as UTF-8 CSV and compare the headers exactly with Shopify's current template.
>
> Shopify distinguishes between an omitted optional column and a present-but-blank column, and variant fields can depend on the option identity columns.[11][12]
>
> I built ProductCSVFixer for a browser-based static pre-flight before upload. The free preview can help locate malformed rows, header/field problems, and Shopify CSV blockers without sending the catalog to us: https://productcsvfixer.com/shopify-csv-import-errors?utm_source=shopify-community&utm_medium=community&utm_campaign=story4-referral&utm_content=file-original-source-missing
>
> It cannot confirm whether Shopify's servers can fetch a remote image or diagnose a store-specific file service, so keep the troubleshooting imports out of the existing production handle until the complete-group test is proven safe.

### Candidate B — unresolved inventory-policy error

Thread: https://community.shopify.com/t/cant-import-products-csv-keep-getting-error-inventory-policy-is-not-included/420339

Tracked link:

https://productcsvfixer.com/shopify-inventory-policy-csv-error?utm_source=shopify-community&utm_medium=community&utm_campaign=story4-referral&utm_content=inventory-policy-continue

Proposed answer:

> `continue` is a valid value, so if every visible cell contains it, I would check the column mechanics rather than keep retyping the same value:
>
> 1. Compare the header against a newly downloaded Shopify template. In Shopify's current field map this setting is `Continue selling when out of stock`; older exports may label it `Variant Inventory Policy`.
> 2. Inspect the raw CSV for trailing spaces, formulas, curly quotes, or a different delimiter. The value must be plain `continue` or `deny`.
> 3. Check continuation/variant rows under the same handle too—not only the first product row.
> 4. Confirm that inventory tracking and fulfillment fields are coherent for those rows. If there is no custom fulfillment service, use the template's normal/manual fulfillment value.
> 5. Test one product group before retrying the whole catalog.
>
> Shopify's current documentation lists `deny` and `continue` as the accepted values and describes the fulfillment and inventory dependencies.[11]
>
> I built ProductCSVFixer for this pre-upload check. It runs in the browser and gives a free issue preview; the optional $9 unlock is only for the complete row/cell report and Shopify-ready export: https://productcsvfixer.com/shopify-inventory-policy-csv-error?utm_source=shopify-community&utm_medium=community&utm_campaign=story4-referral&utm_content=inventory-policy-continue

## Prepared hold answers

These are ready only if a new question makes them additive. They should not be posted to the current thread state.

### 1. Fulfillment service and inventory policy

> The two fields need to agree with Shopify's accepted values, not merely be nonblank. Use `deny` or `continue` for the inventory policy. For fulfillment, use `manual` when there is no custom service; otherwise use the exact configured service handle. Test one complete product group, including continuation variant rows, before retrying the file.[1][11]

### 2. Supplier PDF to Shopify CSV

> Treat Claude as an extraction assistant, not the final importer. Build a review table keyed by supplier SKU, separate new products from exact-SKU updates, expand every option combination into its own variant row, and use public image URLs. Generate a Shopify CSV, review a small subset, pre-flight it, and import that subset before the full catalog. Keep the original PDF and current Shopify export as the audit trail.[2][11][12]

### 3. Variants deleted during a CSV update

> Keep a last-known-good full export before another import. For every affected handle, preserve the complete variant row set and all option identity columns; do not assume a price-only file is safe if variant rows were removed. Test one product and compare the live variant count afterward. A static pre-flight can catch structural risks, but it cannot restore deleted IDs, inventory history, or app references.[3][12]

### 5. Price-only updates

> Start with a fresh export, preserve the handle plus the option names/values that identify each variant, modify only the price values, and omit optional columns you do not intend to change rather than leaving them present and blank. Test a few products first. Shopify documents that an omitted optional column is preserved, while a blank included column can overwrite the existing value.[5][12]

### 6. Variant images ignored

> Separate product-gallery images from variant image assignments. Keep each product's rows together, preserve the handle and option identity, and omit the variant-image column entirely when you are not changing it. If you are changing it, test one product and verify the live variant-to-image assignments after import; a successful CSV parse does not prove that Shopify attached every image as intended.[6][11][12]

### 7. Approximately 9,000 products with variants and images

> Do not begin with the full catalog. Create one representative shoe with every color/size combination and all intended images, import it, verify it in the storefront, then expand in batches. Reuse one handle for all variants of a product, give each option combination its own row, and use one additional row per additional product image. Shopify's product CSV limit is 15 MB, so split larger files.[7][11][12]

### 8. “Successful” import with no products

> Check the confirmation email for skipped-row details, then validate the raw file: exact Shopify headers, UTF-8 encoding, a title on each new product's first row, and consistent handles for continuation rows. Test one product group from a fresh template before retrying the full file.[8][11][12]

### 10. Field map for simple products

> For a simple new product, begin with Shopify's current template and fill the product title, description, price, and a public product-image URL; Shopify can default several optional values. If you add variants or update existing products, the handle and option identity become important dependencies. Build and test one complete product first, then duplicate that known-good row structure for the remaining catalog.[10][11][12]

## Measurement clock and decision windows

Day 0 is the publication time of the first approved linked answer. Internal QA remains visible for audit but excluded from qualified PostHog decision cards.

### After 3–5 days — directional and instrumentation check

Review:

- qualified `community_referral` sessions,
- `utm_content` split between the two answers,
- landing-page views and CTA clicks,
- sample loads versus user uploads,
- validation completions,
- sample-report downloads,
- unexpected attribution gaps or analytics errors.

Decision: fix only a demonstrated tracking or broken-link problem. Do not change positioning, price, or the funnel from this early sample.

### After 7 complete days — first weekday/weekend baseline

Review:

- qualified visits by day and source answer,
- landing-to-CTA rate,
- CTA-to-sample/upload rate,
- upload-to-validation-completion rate,
- paid-unlock and checkout-start signals,
- whether either answer generated activity beyond a pageview.

Decision: if one answer produces qualified activation, prepare two more answers matching that exact problem language. If visits occur without activation, inspect message-to-landing relevance before changing the app.

### After 10–14 days — acquisition and funnel assessment

Review:

- cumulative qualified community traffic,
- repeated activation patterns rather than single events,
- GSC branded/query changes separately from referral traffic,
- paid-unlock, checkout-success, and paid-download evidence,
- whether the acquisition bottleneck moved deeper into the funnel.

Decision rules:

| Observed signal                       | Interpretation                     | Next move                                                               |
| ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| No qualified visits                   | Distribution/source problem        | Find newer unsolved threads; do not change the product.                 |
| Visits but no CTA                     | Landing relevance or trust problem | Compare answer promise with landing copy and privacy proof.             |
| CTA but no sample/upload              | Workflow-entry friction            | Inspect sample visibility and upload confidence.                        |
| Validation but no paid unlock         | Paid value problem                 | Reassess free-versus-paid explanation using the Story 3 report example. |
| Paid unlock but no checkout success   | Checkout, trust, or price friction | Run the distinct paid-flow QA before changing price.                    |
| Checkout success but no report/export | Entitlement or return-flow defect  | Treat as a release blocker and fix immediately.                         |
| Repeated qualified activations        | Early acquisition signal           | Expand only the winning thread/problem cluster.                         |

## Publication approval gate

Before posting, re-open Candidate A and Candidate B and confirm each remains visible, open, unresolved, and free of a new equivalent answer. If either condition changed, skip it rather than forcing the batch size.

Required approval should name the selected posts explicitly. No credentials, account creation, or identity-bearing publication is part of this preparation artifact.

## Sources

[1] https://community.shopify.com/t/fulfillment-service-is-not-defined-for-your-shop-inventory-policy-is-not-included-in-the-list/629802
[2] https://community.shopify.com/t/can-claude-upload-shopify-products-automatically-from-supplier-pdf-catalogue/653358
[3] https://community.shopify.com/t/csv-product-import-deleted-variants-shopify-you-got-some-explaining-to-do/582717
[4] https://community.shopify.com/t/file-original-source-missing-from-the-product-files-input/588637
[5] https://community.shopify.com/t/can-i-change-product-prices-via-csv-without-affecting-other-properties/290296
[6] https://community.shopify.com/t/variant-image-column-ignored-in-csv-import/285604
[7] https://community.shopify.com/t/what-is-the-best-way-to-add-products-in-bulk-with-color-and-size-variant-and-different-pictures-for-each-color-around-9000-unique-barcode/575067
[8] https://community.shopify.com/t/why-does-my-csv-file-import-show-successful-but-no-products-upload/93655
[9] https://community.shopify.com/t/cant-import-products-csv-keep-getting-error-inventory-policy-is-not-included/420339
[10] https://community.shopify.com/t/field-map-for-product-template-csv/553370
[11] https://help.shopify.com/en/manual/products/import-export/using-csv
[12] https://help.shopify.com/en/manual/products/import-export/import-products
