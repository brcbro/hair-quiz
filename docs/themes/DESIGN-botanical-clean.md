---
version: alpha
name: Botanical Clean
description: Fresh botanical theme for the hair quiz. Same layout — soft sage, leaf-green primary, friendly rounded sans.
colors:
  primary: "#4F7A4E"
  primary-hover: "#3F633E"
  on-primary: "#FFFFFF"
  secondary: "#7D8A7A"
  tertiary: "#7FA37A"
  tertiary-bright: "#C9DEC6"
  neutral: "#FBFCFA"
  surface: "#EEF3EC"
  results-surface: "#E8F0E6"
  background: "#FBFCFA"
  on-background: "#1F2A1E"
  on-surface: "#1F2A1E"
  on-surface-variant: "#667163"
  outline: "#B7C4B4"
  outline-strong: "#1F2A1E"
  option-hover: "#F1F6EF"
  option-selected: "#E5EFE3"
  track: "#D7E2D5"
  success: "#2F6B3A"
  toast: "#1F2A1E"
typography:
  question:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: "700"
    lineHeight: 1.35
  option:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.35
  option-selected:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: "700"
    lineHeight: 1.35
  button:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 1.2
    letterSpacing: 0.04em
  progress-label:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: "800"
  back-link:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: "700"
  loading-title:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: "700"
  results-brand:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: "800"
    letterSpacing: 0.12em
  results-title:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: "800"
  results-subtitle:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 1.5
  product-name:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: "700"
  product-desc:
    fontFamily: Nunito Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 1.5
  product-price:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: "800"
rounded:
  option: 16px
  button: 16px
  card: 16px
  email: 40px
  progress: 8px
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

Clean botanical care: soft sage surfaces, leaf-green CTAs, rounded friendly corners, Nunito Sans. Feels natural and trustworthy — ingredient-conscious, not farmhouse kitsch.

## Colors

Green primary; pale sage surfaces. Selection wash is mint-sage, not solid green.

## Typography

Nunito Sans only. Slightly heavier weights for warmth and accessibility.

## Layout

Same quiz structure as baseline. No leaf illustrations in the step chrome.

## Elevation & Depth

Flat steps. Soft ambient shadow on results cards only.

## Shapes

Generous 16px rounding on options/buttons/cards; pill email; thicker progress capsule.

## Components

Same inventory. Progress can be solid green or soft `#4F7A4E → #7FA37A` gradient.

## Do's and Don'ts

- Do keep the UI airy and friendly.
- Don't add watercolor plant backgrounds or sticker badges.
- Don't drift into earthy brown / terracotta clichés.
