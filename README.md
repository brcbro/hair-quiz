# Live Love Locks Hair Quiz (Local Rebuild)

Fully **offline** local rebuild of the personalized hair quiz (no Octane API at runtime). Includes a local appointment booking form that saves requests and can email the salon via SMTP.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/

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