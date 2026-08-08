---
version: alpha
name: Rose Atelier
description: Soft blush beauty theme for the Live Love Locks hair quiz. Same layout as baseline — blush primary, warm paper surfaces, refined serif question titles.
colors:
  primary: "#C45C6A"
  primary-hover: "#A84A57"
  on-primary: "#FFFFFF"
  secondary: "#9A8F8C"
  tertiary: "#E8A0A8"
  tertiary-bright: "#F6D5D8"
  neutral: "#FFFBF9"
  surface: "#F7EEEA"
  results-surface: "#F3E8E4"
  background: "#FFFBF9"
  on-background: "#2A2224"
  on-surface: "#2A2224"
  on-surface-variant: "#8A7E7B"
  outline: "#C9B8B4"
  outline-strong: "#2A2224"
  option-hover: "#F8F0ED"
  option-selected: "#F3E6E2"
  track: "#EADDD9"
  success: "#3D6B4F"
  toast: "#2A2224"
typography:
  question:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 1.35
    letterSpacing: -0.01em
  option:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.35
  option-selected:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 1.35
  button:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 1.2
    letterSpacing: 0.08em
  progress-label:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 1.2
  back-link:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "600"
  loading-title:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: "600"
  results-brand:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: 0.16em
  results-title:
    fontFamily: Fraunces
    fontSize: 30px
    fontWeight: "600"
  results-subtitle:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.5
  product-name:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: "600"
  product-desc:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 1.5
  product-price:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: "700"
rounded:
  option: 12px
  button: 12px
  card: 14px
  email: 40px
  progress: 6px
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 30px
  xxl: 40px
  content-max: 600px
  options-max: 320px
  options-min: 240px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    typography: "{typography.button}"
  option:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.option}"
  progress-fill:
    backgroundColor: "{colors.primary}"
---

## Overview

Intimate boutique-salon energy: soft rose primary, warm paper canvas, Fraunces for questions and DM Sans for UI. Romantic but clean — no glitter, no purple.

## Colors

Blush rose drives CTAs and progress. Outlines are dusty rose-gray. Selected options use a warm blush wash, not a loud fill.

## Typography

Fraunces for questions/results titles (editorial softness). DM Sans for options, buttons, labels (uppercase CTAs with wider tracking).

## Layout

Identical to baseline Live Love Locks quiz shell. Compact stacked options, progress top, compact CTA footer.

## Elevation & Depth

Still mostly flat on quiz steps. Cards on results may use a very soft warm shadow.

## Shapes

Softer 12px options/buttons; email remains pill.

## Components

Same component set as baseline. Progress fill may be solid blush or a soft rose gradient (`#C45C6A → #E8A0A8`).

## Do's and Don'ts

- Do keep text-only options and compact widths.
- Don't add floral illustrations as chrome on the quiz step.
- Don't switch to dark mode in this theme.
