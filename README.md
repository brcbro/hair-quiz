# Customised Haircare routine

Personalized hair questionnaire for Customised Haircare. Maps quiz answers to a hair profile, product regimen, and wash-day ritual. Live leads go to **Firebase** (`salon-anchor`). The site is hosted on **Cloudflare Workers**.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/

Admin dashboard: [http://localhost:5173/admin.html](http://localhost:5173/admin.html)

## Leads & consultations

| Capture | Where it goes |
|---------|----------------|
| Quiz email, selected answers, hair profile | Firestore `quizResponses` |
| Suggested products for that quiz | Same quiz document, updated on the results page |
| Shop clicks on any product | Firestore `shopClicks` |
| Consultation form | Firestore `consultations` (admin dashboard) + Google Sheet + Gmail notify |

Each consultation submit is saved in Firebase (admin dashboard). The Worker then posts the same details to a **Google Apps Script** web app, which appends a Google Sheet row and emails you.

Setup: [scripts/GOOGLE_APPS_SCRIPT_SETUP.md](scripts/GOOGLE_APPS_SCRIPT_SETUP.md). After deploying the script, store `GOOGLE_APPS_SCRIPT_URL` and `GOOGLE_APPS_SCRIPT_SECRET` with `npx wrangler secret put`. Local `npm run dev` uses the same keys in `.env`. SMTP in `.env` is only a fallback if the Apps Script URL is missing.

## 1. Firebase project (`salon-anchor`)

Do this once in [Firebase Console](https://console.firebase.google.com/) for project **salon-anchor**:

1. **Build → Firestore Database** → Create database (production mode, region closest to you).
2. **Build → Authentication** → Sign-in method → enable **Email/Password**.
3. Authentication → Users → **Add user** with the admin email and password for `/admin.html`.
4. Copy that user's **User UID**.
5. In Firestore, create collection `admins`, document ID = that UID, field `{ "role": "admin" }`.
   The `admins` collection cannot be written from the app; this document must be created in the console.
6. Deploy security rules from this repo:

```bash
npx firebase-tools login
npm run firebase:rules
```

Or paste `firestore.rules` into Firestore → Rules → Publish.

7. After Cloudflare gives you a hostname (step 3), go to Authentication → Settings → **Authorized domains** and add it (for example `hair-quiz.<your-subdomain>.workers.dev`). Keep `localhost`.

The web app config is already in `.env` (`VITE_FIREBASE_*`). Restart `npm run dev` after changing `.env`.

### Copy old quiz data from `hair-quiz-1`

The previous project keys are stored as `SOURCE_FIREBASE_*` in `.env`. After Firestore exists on `salon-anchor` and rules are published:

```bash
npm run migrate:firestore
```

Sign in with an **admin email + password from the old project**. This copies `quizResponses`, `shopClicks`, and `consultations`. It does **not** copy Auth users or the `admins` collection (UIDs are different in the new project). Recreate the admin user as in steps 3–5 above.

## 2. Host on Cloudflare

1. Install dependencies (`npm install`) and log in:

```bash
npx wrangler login
```

2. Build and deploy:

```bash
npm run deploy
```

Wrangler prints a `*.workers.dev` URL. Open it, take the quiz once, then sign in at `/admin.html`.

3. Optional custom domain: Cloudflare dashboard → Workers & Pages → `hair-quiz` → Settings → Domains & Routes → Add. Then add that domain to Firebase Authorized domains too.

Later deploys are the same command: `npm run deploy`.

Git deploys (Workers Builds) use `npm run build` then `npx wrangler deploy`. The Worker name in the dashboard must be `hair-quiz` to match `wrangler.jsonc`. Production Firebase keys are in `.env.production`.

## Combo matrix (Excel)

All answer chains → outputs are exported to:

- `docs/quiz-combo-matrix.xlsx` — multi-sheet workbook (open in Excel / Google Sheets)
- `docs/hair-type-162.csv` — quick hair-type lookup only

Regenerate:

```bash
node scripts/export-combo-matrix.js
```

Sheets inside the workbook:

| Sheet | What it shows |
|-------|----------------|
| How_to_read | How to use the file |
| Hair_Type_162 | Frustration × wash × air-dry × pattern → Fine/Medium/Coarse |
| Q1_Q2_Severity | Frustration + severity question → severity/damage |
| Product_Rules | When products show/hide |
| Full_Chains | ~20k full paths: selections on the left, outputs on the right |

## Lookskart brand products

Product catalog exports for focus brands on [lookskart.com](https://lookskart.com/):

- `docs/lookskart-brand-products.xlsx` — products + brand summary + notes
- `docs/lookskart-brand-products.csv`
- `docs/lookskart-hair-brands.csv` — brand list with live product counts

Regenerate (uses `docs/data/lookskart-products-page1.json`):

```bash
node scripts/export-lookskart-brand-products.js
```

Results-page product CTAs open the matching Lookskart product pages (no Live Love Locks cart).
