# Customised Haircare routine

Offline personalized hair questionnaire for Customised Haircare. Maps quiz answers to a hair profile, product regimen, and wash-day ritual. Includes a consultation request form that can email the salon via SMTP.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Leads & consultations

When users finish the quiz or request a consultation, details are saved locally (and emailed if SMTP is set):

| Capture | API | Saved to |
|---------|-----|----------|
| Quiz email (+ answers snapshot) | `POST /api/lead` | `data/leads.json` |
| Consultation form | `POST /api/book` | `data/bookings.json` |

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
