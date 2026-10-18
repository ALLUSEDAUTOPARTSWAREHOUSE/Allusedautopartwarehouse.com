# Catalog Control dashboard

Open Admin → Products or Google Feed Dashboard. The new health section uses the existing effective catalog/feed statistics. Brand search and Needs review only filter locally; Compact, Comfortable and Large change table density. Refresh counts requests a fresh server render; it does not start a feed fetch, import or background sync.

Counts distinguish all records, visible products (total minus hidden), feed-eligible products, missing prices and generated-image review flags. Issues overlap and must not be summed as unique affected records. The computation timestamp is not a successful sync timestamp. Google account authorization is not implemented, so accepted/rejected/published counts remain unavailable. Recent override counts remain capped at 500 and are labeled accordingly.

Per-brand shortcuts open the current product editor, upload panel, missing-price queue and generated-image review queue. Existing save/confirmation controls are unchanged. No catalog mutations run when this dashboard loads. Reduced-motion styles disable decorative transition effects.

This is the health/navigation/design phase of the requested upgrade. It does not add stock aggregation, SKU duplicate audits, column mapping, new bulk mutation operations, durable import validation, undo, brand replacement or Google account deletion. Large-file staging and live account connections require separate validation. Existing single-product and uploaded/manual bulk editors remain the way to make approved changes.

Release verification: compare a known brand's counts to effective catalog results, test every shortcut and density size, save a preview product edit and refresh counts, and verify unauthenticated access still redirects to login. Test on preview before merging. Local test data does not establish live database correctness or external Google acceptance.
