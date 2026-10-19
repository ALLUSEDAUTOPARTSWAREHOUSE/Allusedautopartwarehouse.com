# All-brand catalog reset

This release switches the shared brand catalog to replacement-upload-only mode. Bundled source files and existing database records are retained, not deleted. Before publishing, confirm that an empty catalog for every brand without a replacement is intended.

Only database rows whose source is `upload` and whose `updated_at` is later than the fixed reset cutoff (2026-10-19T00:38:44.201Z) enter the brand overlay. Re-importing a row updates its timestamp and makes it eligible again. An ordinary edit of an old row whose source is upload can also move it past the cutoff: do not edit archived uploads unless intending to re-enable them. Manual-source rows are excluded. Existing per-product visibility and feed exclusions still apply.

The shared loader controls brand listings, product lookup, related products, feed statistics and the Google XML feed. Old product URLs through that loader stop resolving. Brand names remain available as upload destinations. Original manifest counts are historical source counts; live counts come from feed statistics. Other independently maintained storefront catalogs are not rewritten by this policy.

The admin uploaded/manual list intentionally preserves records for management and is not a live inventory total. Counts start at zero when no replacement qualifies. Database overlay load failures clear cached overlays instead of leaking earlier data.

This does not import the attached Mazda workbook, implement 500 MB processing, permanently delete rows or directly remove anything from Google Merchant or social accounts. Feed contents change only after deployment; Google must fetch/process that feed separately. No external removal is verified.

To undo the source exclusion, set `UPLOADED_ONLY_CATALOG` false and redeploy (restore preserved source products). Retain the cutoff unless deliberately starting a new reset. Preview brand listings, old product URLs, replacement uploads and feed counts before promoting. Existing order and quote history remains unchanged.
