# YouTube OAuth + Publishing (MVP)

## Required env vars

Add these to your backend `.env`:

```env
YOUTUBE_CLIENT_ID=..
YOUTUBE_CLIENT_SECRET=..
YOUTUBE_REDIRECT_URI=http://127.0.0.1:3000/youtube-auth/callback
```

`YOUTUBE_REDIRECT_URI` must be added to Google Cloud OAuth redirect URIs.

## New endpoints

- `POST /youtube-auth/start` (JWT required)
- `GET /youtube-auth/callback`
- `GET /youtube-auth/me` (JWT required)
- `DELETE /youtube-auth/disconnect` (JWT required)
- `POST /youtube-auth/publish` (JWT required, public `videoUrl`)
- `POST /youtube-auth/publish-upload` (JWT required, `multipart/form-data`, max file size: **1GB**)

## Basic flow

1. Call `POST /youtube-auth/start` with optional body:

```json
{
  "appRedirectUri": "ideaspark://oauth-callback"
}
```

2. Open returned `authUrl` in browser.
3. Google redirects to `/youtube-auth/callback`.
4. Account is saved in MongoDB collection `youtubeaccounts`.
5. Publish via `POST /youtube-auth/publish` with a public `videoUrl`.

## Publish payload example (public URL)

```json
{
  "videoUrl": "https://your-cdn.com/video.mp4",
  "title": "My test upload",
  "description": "Uploaded from IdeaSpark",
  "tags": ["ideaspark", "ai"],
  "privacyStatus": "private"
}
```

## Publish upload example (from phone file)

Use `multipart/form-data` with these fields:

- `video` (binary file, required)
- `title` (required)
- `description` (optional)
- `tagsCsv` (optional, comma-separated)
- `privacyStatus` (`private` | `unlisted` | `public`, optional)

## Quick verification

```powershell
npm run build
```
