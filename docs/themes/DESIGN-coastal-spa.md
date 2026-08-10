---
version: alpha
name: Coastal Spa
description: Cool seafoam spa theme for the hair quiz. Same layout — mist backgrounds, teal primary, calm sans typography.
colors:
  primary: "#2F6F6A"
  primary-hover: "#255A56"
  on-primary: "#FFFFFF"
  secondary: "#7A8B88"
  tertiary: "#5FA39B"
  tertiary-bright: "#B8DED8"
  neutral: "#F4F8F7"
  surface: "#E7F1EF"
  results-surface: "#EAF3F1"
  background: "#F7FBFA"
  on-background: "#1C2B29"
  on-surface: "#1C2B29"
  on-surface-variant: "#5F6F6C"
  outline: "#A8B8B5"
  outline-strong: "#1C2B29"
  option-hover: "#EAF3F1"
  option-selected: "#DCECE9"
  track: "#D5E3E0"
  success: "#2F6B3A"
  toast: "#1C2B29"
typography:
  question:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: "600"
    lineHeight: 1.4
  option:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.35
  option-selected:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 1.35
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 1.2
    letterSpacing: 0.06em
  progress-label:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: "700"
  back-link:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "600"
  loading-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: "600"
  results-brand:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: "700"
    letterSpacing: 0.14em
  results-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: "700"
  results-subtitle:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.5
  product-name:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: "600"
  product-desc:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 1.5
  product-price:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: "700"
rounded:
  option: 8px
  button: 9999px
  card: 12px
  email: 40px
  progress: 5px
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

Calm coastal spa: misted aqua surfaces, deep teal CTAs, Plus Jakarta Sans throughout. Feels restorative and clean — like a modern wash-house, not a tropical resort poster.

## Colors

Teal primary for CTA/progress. Mist backgrounds (`#F7FBFA`). Selected options get a cool seafoam wash.

## Typography

Single family (Plus Jakarta Sans). Slightly bolder CTA weight for clarity on light mist backgrounds.

## Layout

Identical quiz shell to baseline. No wave decorations or full-bleed beach photography in the chrome.

## Elevation & Depth

Flat quiz steps. Optional very soft cool shadow on results cards only.

## Shapes

Options 8px; primary CTA is pill (`full`). Email stays pill.

## Components

Progress fill solid teal or soft teal gradient. Spinner uses teal accent.

## Do's and Don'ts

- Do keep the UI airy and low-contrast on surfaces, high-contrast on text/CTA.
- Don't add ocean photography behind the question.
- Don't use neon turquoise or heavy glass effects.
