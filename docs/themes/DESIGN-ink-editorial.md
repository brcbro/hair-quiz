---
version: alpha
name: Ink Editorial
description: High-contrast ink editorial theme for the Live Love Locks hair quiz. Same layout — stark white, black type, single coral accent for CTAs only.
colors:
  primary: "#E4572E"
  primary-hover: "#C94722"
  on-primary: "#FFFFFF"
  secondary: "#6B6B6B"
  tertiary: "#E4572E"
  tertiary-bright: "#F4A48E"
  neutral: "#FFFFFF"
  surface: "#F5F5F5"
  results-surface: "#F0F0F0"
  background: "#FFFFFF"
  on-background: "#111111"
  on-surface: "#111111"
  on-surface-variant: "#6B6B6B"
  outline: "#111111"
  outline-strong: "#111111"
  option-hover: "#F5F5F5"
  option-selected: "#EEEEEE"
  track: "#E5E5E5"
  success: "#1F7A3F"
  toast: "#111111"
typography:
  question:
    fontFamily: Libre Franklin
    fontSize: 23px
    fontWeight: "700"
    lineHeight: 1.3
    letterSpacing: -0.02em
  option:
    fontFamily: Libre Franklin
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.35
  option-selected:
    fontFamily: Libre Franklin
    fontSize: 15px
    fontWeight: "700"
    lineHeight: 1.35
  button:
    fontFamily: Libre Franklin
    fontSize: 13px
    fontWeight: "700"
    lineHeight: 1.2
    letterSpacing: 0.1em
  progress-label:
    fontFamily: Libre Franklin
    fontSize: 10px
    fontWeight: "700"
    letterSpacing: 0.08em
  back-link:
    fontFamily: Libre Franklin
    fontSize: 13px
    fontWeight: "600"
  loading-title:
    fontFamily: Libre Franklin
    fontSize: 22px
    fontWeight: "700"
  results-brand:
    fontFamily: Libre Franklin
    fontSize: 10px
    fontWeight: "700"
    letterSpacing: 0.16em
  results-title:
    fontFamily: Libre Franklin
    fontSize: 30px
    fontWeight: "800"
    letterSpacing: -0.02em
  results-subtitle:
    fontFamily: Libre Franklin
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.5
  product-name:
    fontFamily: Libre Franklin
    fontSize: 15px
    fontWeight: "700"
  product-desc:
    fontFamily: Libre Franklin
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 1.5
  product-price:
    fontFamily: Libre Franklin
    fontSize: 17px
    fontWeight: "800"
rounded:
  option: 0px
  button: 0px
  card: 0px
  email: 0px
  progress: 0px
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

Magazine-sharp hair quiz: pure white field, ink-black type and borders, coral reserved strictly for primary CTAs and progress fill. Feels decisive and modern — not a newspaper multi-column layout.

## Colors

Black outlines everywhere. Coral (`#E4572E`) is the **only** accent and only on interactive emphasis (CTA, progress, brand eyebrow). Never tint large backgrounds coral.

## Typography

Libre Franklin throughout. Tight tracking on titles. Uppercase CTAs with clear letter-spacing.

## Layout

Same centered quiz shell. Square geometry reinforces editorial clarity without adding columns or rules between options.

## Elevation & Depth

Zero shadows on quiz steps. Selected state = thicker black border + light gray fill. Results cards: 1px black border, no soft shadow.

## Shapes

**0px radius** globally (except do not invent pills). Email is rectangular to match.

## Components

Progress: solid coral on light gray track. Options: 1px black border. CTA: solid coral rectangle.

## Do's and Don'ts

- Do keep coral scarce so it pops.
- Don't recreate broadsheet multi-column layouts or dense hairline article grids.
- Don't round corners or add soft pastel fills.
