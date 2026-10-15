# Forms & vendor documents — security notes

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID` | yes | Save form submissions to Airtable |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob store for W9 / COI uploads (added automatically when a Blob store is connected) |
| `RESEND_API_KEY` | yes | Email notifications |
| `NOTIFY_EMAIL` | no | Who receives the notifications. Default: `tayroofing@gmail.com` |
| `EMAIL_FROM` | no | Sender address. Default: `onboarding@resend.dev` |
| `ALLOWED_ORIGINS` | no | Extra origins allowed to post the forms, comma-separated (e.g. a preview URL) |

`onboarding@resend.dev` is Resend's test sender: it only delivers to the Resend account owner, so vendor
confirmation emails will not reach vendors. To send from `general@taycoturnkey.com`, verify `taycoturnkey.com`
in Resend, then set `EMAIL_FROM=general@taycoturnkey.com` (and `NOTIFY_EMAIL` if notifications should go there too).

## Vendor documents

W9s contain EIN/SSN, so uploads are stored as **private** blobs with a random name. Nobody can open them by URL.
The notification email carries them as attachments; Airtable keeps only the private pathname.

## Rate limiting

The per-IP limits in `app/api/_utils.ts` live in memory, so each serverless instance counts separately.
For a hard limit, add a rule in Vercel → Firewall → Rate limiting on `/api/*` (e.g. 10 requests / minute per IP).
