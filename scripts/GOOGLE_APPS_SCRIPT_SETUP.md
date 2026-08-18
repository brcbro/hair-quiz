# Consultation notify (Google Apps Script)

Each consultation submit already saves to Firebase. This script also:

1. Appends a row to a Google Sheet
2. Emails you from your Gmail via `MailApp`

The live site never talks to Google directly. Cloudflare Worker (or local Vite) posts to the Apps Script web app.

## 1. Sheet + script

1. Open [Google Sheets](https://sheets.google.com) and create a spreadsheet, e.g. `Hair Quiz Consultations`.
2. **Extensions → Apps Script**. Delete the starter function.
3. Paste `scripts/consultation-email-script.gs`.
4. Set these two constants at the top:
   - `ADMIN_EMAIL` — the Gmail/inbox that should get the notification
   - `SCRIPT_SECRET` — a long random string (same value you will store in Cloudflare)
5. Save. Select `setupSheet` → **Run**. Grant access to Sheets and Gmail when asked.

## 2. Deploy the web app

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (the Worker authenticates with `SCRIPT_SECRET`)
5. **Deploy** and copy the web app URL (`https://script.google.com/macros/s/.../exec`)

If you change the script later, deploy again (**Manage deployments → Edit → New version**).

## 3. Point the site at the script

### Live (Cloudflare Worker)

```bash
npx wrangler secret put GOOGLE_APPS_SCRIPT_URL
npx wrangler secret put GOOGLE_APPS_SCRIPT_SECRET
npm run deploy
```

Paste the web app URL, then the same secret you put in the Apps Script.

If the Worker is also deployed from Cloudflare’s Git integration, add the same two secrets in the Worker dashboard → Settings → Variables and Secrets.

### Local (`npm run dev`)

Add to `.env`:

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_SECRET=the-same-secret
```

## 4. Test

- In Apps Script, run `sendTestEmail`. You should get a mail and a Sheet row.
- Submit the consultation form on the site. Check the Sheet and your inbox (and spam).

## Notes

- Free Gmail can send about 100 `MailApp` messages per day.
- Keep the spreadsheet private; only the web app URL needs to be reachable.
- Do not put `SCRIPT_SECRET` in frontend code.
