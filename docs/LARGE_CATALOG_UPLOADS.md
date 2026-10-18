# 500 MB catalog staging uploads

In Admin → Products → Upload sheet, use **Large catalog upload**. Choose the brand and an Excel/CSV file, then Upload to staging. The limit is exactly 500,000,000 bytes (decimal 500 MB) per file. Browser checks and Blob upload tokens enforce the same upper boundary. The browser uploads multipart directly to private Blob storage; file bytes do not pass through a Server Action or Function body.

This feature stages files only. It does not parse a 500 MB workbook, validate product contents, replace a brand, remove products, or publish Google Merchant feeds. A separate durable/batched import worker and approval preview are still required. The small existing import form is unchanged and must not be used for large files.

## Required deployment configuration

- Connect a **private** Vercel Blob store and expose its managed `BLOB_READ_WRITE_TOKEN` to the intended preview/production environments. A public store token is not compatible with this private uploader. Never paste tokens in chat or commit them.
- The database connection must support the additive `catalog_staged_uploads` table, created on first upload/list read. No existing catalog rows are changed.
- Keep upload callback access reachable by Vercel Blob. Callbacks are verified by the SDK signature, not a browser session. Deployment Protection may require an appropriately configured integration bypass; do not disable project-wide protections just to test uploads.
- Deploy the PR and test a real private upload on preview before promotion. Storage/operations/transfer charges and account quotas apply. No store or billing settings are changed by the code PR.

## Status and validation

Progress shows browser transfer progress. `uploading` means the server has issued authorization; it can also represent an interrupted upload. `uploaded` means a signed completion callback confirmed storage. Neither status means product validation or publication. Expected byte counts are client-declared metadata, not verified workbook size or content. Treat all stored files as untrusted input.

Tokens expire after one hour; each authorization uses a unique random pathname restricted to the selected brand. Original filenames are stored as metadata, not used as storage paths. Only authenticated admins may request tokens or view staging records. Stored file URLs are not returned by the listing API or exposed as public links.

No automatic cleanup/retention or resumable-across-reload workflow is implemented. Admins must monitor failed attempts and remove obsolete staging files through Blob storage management under their retention policy. Refresh/retry creates a new upload attempt, not an overwrite. There are no per-user daily upload quotas in this first version.

## Release checks

Test an anonymous token request (401), cross-origin request (403), unsupported type, zero-length file, 500,000,001-byte file rejection, valid multipart transfer, signed callback status update, private download authorization, and unchanged catalog/feed records. A true 500 MB end-to-end upload and downstream import capacity have not been verified by local tests.
