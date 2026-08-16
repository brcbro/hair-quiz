# Customised Haircare routine

Offline personalized hair questionnaire for Customised Haircare. Maps quiz answers to a hair profile, product regimen, and wash-day ritual. Includes a consultation request form that can email the salon via SMTP.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Leads & consultations

When users finish the quiz or request a consultation, details are saved to **Firebase** (and still written locally during `npm run dev`):

| Capture | Where it goes |
|---------|----------------|
| Quiz email, selected answers, hair profile | Firestore `quizResponses` |
| Suggested products for that quiz | Same quiz document, updated on the results page |
| Shop clicks on any product | Firestore `shopClicks` |
| Consultation form | `POST /api/book` → `data/bookings.json` (+ email if SMTP is set) |

Admin dashboard (login required): [http://localhost:5173/admin.html](http://localhost:5173/admin.html)

### Firebase setup (needed for admin + live insights)

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. **Build → Firestore Database** → Create database (start in production mode).
3. **Build → Authentication** → Sign-in method → enable **Email/Password**.
4. Authentication → Users → **Add user** with the admin email and password you want to use on `/admin.html`.
5. Copy that user's **User UID**.
6. In Firestore, create collection `admins`, document ID = that UID, fields e.g. `{ "role": "admin" }`.
7. Project settings → Your apps → add a **Web** app. Copy the config into `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

8. Deploy rules from this repo (Firebase CLI) or paste `firestore.rules` in Firestore → Rules:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

9. Restart `npm run dev` after saving `.env`.

Copy `.env.example` → `.env` and fill SMTP settings to also email the salon + send the customer a confirmation.

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
