---
version: alpha
name: 7Span Bold Industrial
description: A stark, high-contrast brand system that combines modern sans-serif editorial typography with code-like utility accents and a loud red action color.
colors:
  primary: "#F81927"
  secondary: "#000000"
  tertiary: "#E5E7EB"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#000000"
  border: "#E5E7EB"
  muted: "#F3F4F6"
  error: "#F81927"
typography:
  headline-display:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: 600
    lineHeight: 48px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: 0px
  headline-md:
    fontFamily: Outfit
    fontSize: 34px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: 0px
  headline-sm:
    fontFamily: ui-sans-serif
    fontSize: 29px
    fontWeight: 600
    lineHeight: 35px
    letterSpacing: 0px
  body-lg:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: 0px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 600
    lineHeight: 18px
    letterSpacing: 0px
  label-sm:
    fontFamily: ui-sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  overline:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0px
  nav-link:
    fontFamily: ui-sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 80px
  xl: 120px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "16px 16px"
    size: "135px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "16px 16px"
    size: "135px"
    height: "48px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.nav-link}"
  banner-tag:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

# 7Span

## Overview
7Span feels direct, technical, and confident, with a strong “build it right” tone rather than decorative branding. The page is spacious and editorial, but the black-on-white contrast and red action color keep it energetic and sharp. This system suits a B2B services audience that values clarity, credibility, and a little industrial grit.

## Colors
- **Primary (#F81927):** A saturated signal red used for the main call to action, brand marks, and emphasis. It provides urgency and visual focus without relying on gradients or secondary accents.
- **Secondary (#000000):** Deep black used for body text, headings, navigation, borders, and buttons. It creates the system’s stark, high-contrast backbone.
- **Surface (#FFFFFF):** Pure white used for the page background and content surfaces. The design relies on open white space rather than tinted sections.
- **Tertiary (#E5E7EB):** A light neutral gray used for subtle borders and chips/metadata panels. It supports hierarchy without adding visual weight.
- **Neutral (#FFFFFF):** A clean neutral token for text-on-contrast situations and simple positive space. It keeps the palette minimal and restrained.
- **Border (#E5E7EB):** The default line color for cards and structural separation. Borders are thin and functional, not decorative.
- **Muted (#F3F4F6):** A soft gray for gentle surface contrast where needed, such as labels or low-emphasis containers.
- **Error (#F81927):** The same red is reused for critical states, keeping the alert vocabulary aligned with the brand’s only vivid color.

## Typography
The site uses Outfit for the primary editorial voice: clean, geometric, and modern, with strong weight and tight line-height in large headlines. Hero headlines are bold and compact, while body copy stays readable and open at 24px/36px in the main marketing treatment. JetBrains Mono appears as a deliberate contrast for badge-like labels, CTA copy, and utility text, reinforcing the technical, engineered feel.

Headlines are large, weight 600, and visually assertive with no visible letter-spacing embellishment. Labels and action text feel more structured and code-adjacent when set in JetBrains Mono, while navigation and lower-emphasis utility text can fall back to a standard sans-serif feel. Uppercase treatment is used sparingly but effectively for tags and button text, giving the interface a crisp, operational tone.

## Layout
The layout is a wide, left-aligned marketing composition with a strong central content column and generous margins. White space is a major structural tool: spacing jumps from 8px/16px rhythm at the component level to large section gaps at 80px and 120px. Content blocks feel stacked and deliberate, with clear separation between navigation, hero copy, CTA, and media.

Cards and content surfaces use modest internal padding rather than heavy framing. The design favors a fixed-max-width feel on desktop, with large breathable gutters around the main content area. Sections should remain uncluttered and avoid dense multi-column layouts unless a clear hierarchy is maintained.

## Elevation & Depth
The system is mostly flat. Depth comes from contrast, borders, and spacing rather than shadows or layered elevation. Thin 1px borders and strong tonal separation define structure, while the red CTA provides the only prominent visual pop.

Because shadows are absent, components should rely on alignment, whitespace, and border treatment for emphasis. Media blocks can stand alone as full-width rectangular panels without drop shadow embellishment. Keep depth minimal and intentional.

## Shapes
The overall shape language is restrained and architectural. Corners are usually square to softly rounded, with 4px radii on buttons and 8px on cards. The effect is practical and engineered rather than playful.

Tags and utility labels often appear fully rectangular, which reinforces the technical identity. Avoid pill shapes unless the content truly benefits from them; the system prefers crisp edges and controlled softness.

## Components
**Buttons:** Primary buttons use `button-primary` with a red fill, black text, 16px vertical/horizontal padding, 48px height, and 4px radius. They should feel assertive and compact, with uppercase or near-uppercase label treatment in JetBrains Mono. Secondary buttons (`button-secondary`) are outlined/transparent equivalents with the same sizing, used when the action needs less emphasis. Tertiary actions (`button-tertiary`) should be text-only and visually quiet.

**Navigation:** Nav items are simple text links with no decorative chrome. Keep them black, medium-sized, and evenly spaced, with dropdown indicators used only where necessary. The header should remain clean and unobtrusive.

**Cards:** Cards use a white background, light gray border, 8px radius, and 16px padding. They should feel like contained content modules rather than floating panels. Avoid shadows; the border is the container signal.

**Inputs:** Inputs should match the card language: white surface, black text, light border, and 4px radius. States should be expressed through border color and text contrast rather than glow or shadow. Keep padding comfortable and functional.

**Chips / Tags:** Chips and banner labels use flat gray surfaces with black text and square corners. They should be compact, highly legible, and used for metadata or status rather than decoration. JetBrains Mono is appropriate for these elements when you want a more engineered tone.

**Media blocks:** Large image/video frames are simple rectangles with minimal framing. If a border is present, keep it thin and neutral. The content itself should carry the visual impact.

## Do's and Don'ts
- Do keep the interface high-contrast and text-first.
- Do use red only for primary emphasis, key brand moments, and critical states.
- Do preserve generous whitespace around major marketing sections.
- Do use square or lightly rounded corners; keep shapes disciplined.
- Don't introduce shadows, glow effects, or glassmorphism.
- Don't use multiple bright accent colors alongside the red.
- Don't over-round buttons, cards, or tags into pill shapes.
- Don't crowd the hero area with too many competing visual elements.