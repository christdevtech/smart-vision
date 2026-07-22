# Direct video uploads to Cloudflare R2

SmartVision uploads media directly from the authenticated Payload admin browser to Cloudflare R2. Cloud Run only creates a short-lived presigned upload URL, so the video bytes do not pass through Cloud Run's request-size limit or consume its memory.

## Production configuration

Set these environment variables on the Cloud Run service:

```text
R2_BUCKET=<bucket-name>
R2_ACCESS_KEY_ID=<R2 API token access key>
R2_SECRET_ACCESS_KEY=<R2 API token secret>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_REGION=auto
```

Use an R2 API token restricted to Object Read & Write for this bucket. Keep the bucket private. The application deliberately fails to start in the Cloud Run runtime when any required R2 variable is missing, instead of writing uploads to its ephemeral filesystem. The adapter remains present during image builds even though Cloud Build does not receive runtime secrets.

## Required R2 CORS policy

In the Cloudflare dashboard, open the R2 bucket, choose **Settings**, then apply the CORS policy in [`r2-cors.json`](./r2-cors.json). Add every real admin origin that can upload files. For local admin development, add `http://localhost:3000` as an allowed origin to the development bucket; do not add it to the production policy.

The browser must be allowed to send `PUT` requests with a `Content-Type` header. Protected video playback also uses presigned `GET` requests and byte ranges, so the policy permits `GET`, `HEAD`, and the `Range` header. If this policy is missing or the origin does not match exactly, signing succeeds but browser upload or playback fails with a CORS error.

## Upload flow

1. An authenticated administrator selects a file in the existing Media upload field.
2. Payload checks authentication and the configured 2 GB file-size limit, then returns a presigned R2 URL that expires after ten minutes.
3. The browser sends the file directly to R2 with one `PUT` request.
4. Payload saves the Media document and its relationships to videos, books, or exam papers as before.

Only `admin` and `super-admin` sessions can obtain direct R2 upload signatures. This prevents an ordinary user from requesting a `PUT` signature for an existing lesson filename. Small user profile images continue through the standard Media endpoint and are bound to that user as owner-only media.

The upload collection accepts images, videos, and PDFs. Local development falls back to `public/media` only when no R2 variables are set.

## Media visibility and delivery

Every Media document has an access scope:

- `Protected course content` is the safe default for lesson videos and PDFs. It is unavailable through ordinary Media reads.
- `Public asset` is for covers, thumbnails, logos, and other intentionally public files.
- `Owner only` is assigned automatically to uploads created by ordinary users, including profile pictures.

Administrators must explicitly select `Public asset` for new covers and thumbnails. Existing Media records created before this field was introduced do not need an immediate migration: unclassified images remain public for compatibility, while unclassified video and PDF files are treated as protected.

An entitled lesson request receives an application grant that expires after five minutes and is bound to the user, content record, content field, Media ID, and filename. Payload validates that grant and redirects video playback to a five-minute R2 `GetObject` presigned URL. The private R2 bucket remains the authority for the underlying object; do not enable public bucket access.

## Operational notes

- Treat presigned URLs as secrets while they are valid; do not log or persist them.
- A presigned upload is a single request. For unreliable connections or files approaching the 2 GB application limit, multipart/resumable uploads are a separate enhancement.
- Treat both application grants and R2 presigned URLs as bearer secrets: keep their lifetime short and never log or persist them.
