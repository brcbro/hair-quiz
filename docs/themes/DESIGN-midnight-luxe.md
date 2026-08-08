---
version: alpha
name: Midnight Luxe
description: Dark editorial luxury theme for the Live Love Locks hair quiz. Same layout — charcoal canvas, champagne accent, high-contrast type.
colors:
  primary: "#D4B483"
  primary-hover: "#C4A372"
  on-primary: "#1A1612"
  secondary: "#9A948C"
  tertiary: "#8C7350"
  tertiary-bright: "#E8D4B0"
  neutral: "#141210"
  surface: "#1E1B18"
  results-surface: "#181512"
  background: "#141210"
  on-background: "#F3EEE6"
  on-surface: "#F3EEE6"
  on-surface-variant: "#A39B92"
  outline: "#3A3530"
  outline-strong: "#D4B483"
  option-hover: "#1E1B18"
  option-selected: "#25211D"
  track: "#2A2622"
  success: "#6FA87A"
  toast: "#F3EEE6"
typography:
  question:
    fontFamily: Cormorant Garamond
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 1.25
    letterSpacing: 0.01em
  option:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.4
  option-selected:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: "600"
    lineHeight: 1.4
  button:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: "700"
    lineHeight: 1.2
    letterSpacing: 0.12em
  progress-label:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: 0.08em
  back-link:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: "600"
  loading-title:
    fontFamily: Cormorant Garamond
    fontSize: 26px
    fontWeight: "600"
  results-brand:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: 0.18em
  results-title:
    fontFamily: Cormorant Garamond
    fontSize: 34px
    fontWeight: "600"
  results-subtitle:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.55
  product-name:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: "600"
  product-desc:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 1.5
  product-price:
    fontFamily: Manrope
    fontSize: 17px
    fontWeight: "700"
rounded:
  option: 2px
  button: 2px
  card: 4px
  email: 2px
  progress: 2px
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
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.option}"
  progress-fill:
    backgroundColor: "{colors.primary}"
---

## Overview

After-hours salon luxury: near-black canvas, champagne gold accent, sharp radii, Cormorant for questions and Manrope for UI. Feels like a private appointment booking — refined, not neon cyberpunk.

## Colors

Champagne primary on charcoal. Selected options use a subtle lifted surface + champagne border (not a loud gold fill). Toast inverts to light text on dark is flipped — toast background is light cream with dark text for readability, or keep dark toast with light text; prefer light toast (`#F3EEE6` bg / `#141210` text) if contrast fails.

## Typography

Serif questions (Cormorant Garamond). Geometric sans (Manrope) for controls. Wide letter-spacing on uppercase CTAs.

## Layout

Same shell as baseline. Dark background replaces white; keep compact option column.

## Elevation & Depth

Nearly flat. Hairline borders (`outline`) define options. Avoid heavy glow; a 1px champagne border on selected is enough.

## Shapes

Nearly square (2px) for a tailored editorial feel. Email is **not** a pill in this theme — match option radius (2px) for cohesion.

## Components

Primary CTA: champagne fill + near-black label. Progress: solid champagne on dark track. Close X in light cream.

## Do's and Don'ts

- Do keep high contrast for body text on dark.
- Don't add purple neon, glass blur stacks, or gold particle effects.
- Don't soften into large rounded pills — this theme stays sharp.
