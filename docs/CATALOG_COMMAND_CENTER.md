# Catalog command center

The workspace, dashboard and Products page now offer a shared command center with editing, upload, health and setup shortcuts.

Expand **Hide all uploaded/manual products across all brands**, type `HIDE ALL PRODUCTS`, and confirm. This is an authenticated same-origin POST. One atomic SQL upsert marks current manual/uploaded records hidden and excluded from the local feed without changing stored prices or deleting orders/products. Bundled source catalogs remain excluded by the existing replacement-only policy.

The action affects current records, not a permanent embargo: later new uploads can appear. Reimporting the same product identity does not automatically clear its hidden/feed-excluded override. Review and explicitly unhide approved replacements in the existing product editor. The affected number is rows processed, not a unique count of previously visible products. A database error means refresh visibility before retrying, since invalidation could fail after the DB statement succeeded.

This does not remove Google Merchant/social account products directly, introduce a large-file import worker or row-level validation reports. 500 MB staging is separate from product publication. Existing editing and confirmation controls remain unchanged. No hide action runs during build or deployment.

Release checks: verify anonymous/cross-origin/unconfirmed requests fail, inspect a preview dataset, confirm hide and compare live visible/feed counts, verify prices/history remain, and individually restore one approved product. Test real database and authenticated browser behavior before production promotion.
