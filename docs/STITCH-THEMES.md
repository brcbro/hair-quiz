# Stitch theme workflow — Hair Quiz

Use these files in [Google Stitch](https://stitch.withgoogle.com) to explore **multiple visual themes** of the **same quiz page** without changing layout or copy.

## Files

| File | Theme |
|------|--------|
| [`DESIGN.md`](./DESIGN.md) | **Active — Luxe Marble** |
| [`themes/DESIGN-luxe-marble.md`](./themes/DESIGN-luxe-marble.md) | Soft marble + antique gold + Libre Caslon |
| [`themes/DESIGN-rose-atelier.md`](./themes/DESIGN-rose-atelier.md) | Soft blush + Fraunces |
| [`themes/DESIGN-coastal-spa.md`](./themes/DESIGN-coastal-spa.md) | Seafoam teal spa |
| [`themes/DESIGN-midnight-luxe.md`](./themes/DESIGN-midnight-luxe.md) | Dark champagne luxury |
| [`themes/DESIGN-botanical-clean.md`](./themes/DESIGN-botanical-clean.md) | Sage / leaf green |
| [`themes/DESIGN-ink-editorial.md`](./themes/DESIGN-ink-editorial.md) | Black + coral, sharp edges |

## Workflow

1. Import **`docs/DESIGN.md`** into Stitch Design System.
2. Generate **Q1** with the master prompt inside `DESIGN.md`.
3. Duplicate / derive the rest of the flow from that screen (same shell).
4. To try another look: import one file from `docs/themes/`, then prompt:

```text
Keep the exact same layout, components, spacing, and copy on all screens.
Apply the newly imported DESIGN.md theme tokens only.
Do not add or remove UI elements.
```

5. Export your favorite theme back to code (or hand-map tokens into `src/styles.css` `:root`).

## Rule

**Layout locked. Theme tokens free.** If Stitch invents cards, sidebars, or new steps, reject and re-prompt with the master prompt + DESIGN.md.
