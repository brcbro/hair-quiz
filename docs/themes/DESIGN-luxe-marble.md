---
version: alpha
name: Luxe Marble
description: Affluent marble editorial theme for the Lookskart hair quiz. Soft off-white marble ground, antique gold accents, Libre Caslon Text display + Hanken Grotesk UI. Same quiz structure — visual tokens only.
colors:
  primary: "#775A19"
  primary-hover: "#5D4201"
  primary-container: "#C5A059"
  on-primary: "#FFFFFF"
  secondary: "#5F5E5E"
  secondary-hover: "#474747"
  on-secondary: "#FFFFFF"
  tertiary: "#5D5F5F"
  neutral: "#FFFFFF"
  surface: "#FAF9F9"
  surface-container: "#EEEEED"
  surface-container-high: "#E9E8E8"
  surface-container-lowest: "#FFFFFF"
  results-surface: "#FAF9F9"
  background: "#FAF9F9"
  on-background: "#1A1C1C"
  on-surface: "#1A1C1C"
  on-surface-variant: "#4E4639"
  outline: "#7F7667"
  outline-variant: "#D1C5B4"
  outline-strong: "#775A19"
  option-hover: "#EEEEED"
  option-selected: "#EEEEED"
  track: "#E9E8E8"
  success: "#2F6B3A"
  toast: "#1A1C1C"
  error: "#BA1A1A"
typography:
  brand:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: "700"
  question:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: "400"
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  question-desktop:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: "400"
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  option:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 1.6
  option-selected:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 1.6
  button:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 1.0
    letterSpacing: 0.15em
  progress-label:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    letterSpacing: 0.2em
  back-link:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    letterSpacing: 0.15em
  loading-title:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: "400"
  results-brand:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: "600"
    letterSpacing: 0.15em
  results-title:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: "400"
  results-subtitle:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.6
rounded:
  option: 0.25rem
  button: 0.25rem
  card: 0.25rem
  email: 0
  progress: 0
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 20px
  margin-desktop: 64px
  gutter: 32px
  content-max: 672px
  options-max: 448px
  container-max: 1200px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.button}"
    padding: 16px 32px
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.secondary-hover}"
    textColor: "{colors.on-secondary}"
  option:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-background}"
    borderColor: "{colors.outline-variant}"
    rounded: "{rounded.option}"
    padding: 16px 24px
  option-hover:
    backgroundColor: "{colors.option-hover}"
    borderColor: "{colors.primary-container}"
  option-selected:
    backgroundColor: "{colors.option-selected}"
    borderColor: "{colors.primary}"
  progress-fill:
    backgroundColor: "{colors.primary-container}"
---

## Overview

**Luxe Marble** is the active Lookskart hair-quiz theme sourced from Stitch (“Personalized Results / Q1 Frustration — Luxe Marble”). Affluent, calm, editorial — soft marble atmosphere, antique gold (`#C5A059` / `#775A19`), charcoal secondary CTAs, serif display type.

**Critical rule:** Keep the same page structure, screen list, and copy. Only visual tokens change.

Brand: Lookskart. Product: Personalized hair questionnaire (web).

## Colors

- **Primary (#775A19):** Deep antique gold — selected borders, brand accents, close icon.
- **Primary container (#C5A059):** Progress fill, focus rings, gold hairlines, consultation CTA outline.
- **Secondary (#5F5E5E):** Primary CONTINUE / cart CTAs (charcoal, not gold fill).
- **Background / Surface (#FAF9F9):** Marble-tinted off-white canvas.
- **Outline variant (#D1C5B4):** Hairline borders, option frames, nav rules.
- **On-surface-variant (#4E4639):** Muted body / supporting copy.

## Typography

- **Libre Caslon Text** — questions, section titles, diagnosis, consultation headline.
- **Hanken Grotesk** — options, labels, buttons, body, caps tracking.

## Surfaces

Subtle full-bleed marble texture at ~30% opacity with multiply blend on the quiz shell; lighter on results. No purple gradients, no cream+terracotta default AI look — gold-on-marble only.

## Applied in code

- `src/styles.css` + `index.html` + `src/main.js` — quiz steps
- `public/results.html` — profile / products / routine / consultation
