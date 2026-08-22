---
name: THERMIK
description: Carnet de vols & progression — a calm, sky-and-altitude logbook for paragliding pilots
colors:
  altitude-blue: "#2563eb"
  thermal-amber: "#f59e0b"
  landing-green: "#16a34a"
  signal-red: "#dc2626"
  cloud-white: "#f8fafc"
  pure-white: "#ffffff"
  ink: "#0f172a"
  slate: "#64748b"
  haze: "#e2e8f0"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.altitude-blue}"
    textColor: "{colors.cloud-white}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.altitude-blue}"
  button-destructive:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.signal-red}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  card:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
---

# Design System: THERMIK

## Overview

**Creative North Star: "Ciel et Altitude" (Sky & Altitude)**

THERMIK is a paragliding pilot's personal logbook, filled in on a phone right after landing — often outdoors, in daylight, sometimes with cold hands. The system reads as open sky rather than cockpit instrumentation: one calm blue, one warm amber accent named after the very thermals pilots chase, and a background that is never louder than the activity it records. `docs/ui-directions.md` names the ambition directly — *ciel, altitude, nature, sérénité, progression, carnet personnel, simplicité* — and explicitly rules out "sport extrême" energy, financial-dashboard density, saturated color, and heavy visual effects (glassmorphism, gradients, neon). The implementation holds that line: shadows are almost absent, destructive actions stay in a soft tint rather than alarm-red, and the one piece of decoration in the whole system — three overlapping green radial gradients fixed behind every authenticated screen — reads as a distant mountain silhouette at dusk, not an effect.

Primary and accent are the only colors that stay identical across light and dark mode — a deliberate anchor, confirmed in `globals.css`'s own comment, so the sky and the sun never change character with the time of day the pilot happens to be logging a flight.

**Key Characteristics:**

- One calm accent pair (sky blue + thermal amber), never more than one saturated color live on screen at once.
- Near-flat elevation: `shadow-sm` at most on resting surfaces, reserved shadows for things that float (menus, sheets).
- Soft, generous rounding that scales with a surface's size, never sharp, never fully circular.
- Status colors (success, destructive) stay muted and tinted rather than solid and alarming.
- A single fixed, self-hosted variable font — no CDN dependency, no font-loading flash.

## Colors

The palette is deliberately narrow: one primary, one secondary accent, two status colors, and a neutral scale — nothing saturated is allowed to compete with them.

### Primary

- **Altitude Blue** (`#2563eb`): the sky. Primary actions, active navigation state (`bg-primary/10 text-primary`), links, focus rings, the logo badge gradient. Identical in light and dark mode by deliberate choice.

### Secondary

- **Thermal Amber** (`#f59e0b`): named after the rising warm-air currents ("thermiques") pilots climb on — the product's own namesake color. Used sparingly: stage/training-camp accents, the logo badge gradient's warm half, the CardTitle group-label pattern's sibling role. Also identical in light and dark mode.

### Neutral

- **Cloud White** (`#f8fafc` light) — page background. In dark mode the *same token* becomes **Night Sky** (`#0f172a`) — background and ink swap roles between themes rather than being independently retuned.
- **Pure White** (`#ffffff` light) / **Deep Slate** (`#111827` dark) — card and popover surfaces, one step lifted off the page background in both themes.
- **Ink** (`#0f172a` light text / `#f8fafc` dark text) — primary text color; the same hex as light-mode's own background inverted for dark mode.
- **Slate** (`#64748b` light) / **Mist** (`#cbd5e1` dark) — secondary/muted text.
- **Haze** (`#e2e8f0` light) / **Dusk Border** (`#334155` dark) — hairline borders and dividers; never a heavier structural line than 1px.

### Status

- **Landing Green** (`#16a34a`): success only (toasts, confirmations). Kept semantically separate from the decorative ambient-arc green — same hue family, different purpose, never reused for one when the other is meant.
- **Signal Red** (`#dc2626`): destructive/error. Deliberately soft in application — buttons use `bg-destructive/10 text-destructive` rather than a solid fill; the full-strength hex only appears in borders/rings on invalid form fields.

### Not yet in active use
`globals.css` also defines a five-step neutral `chart-1..5` OKLCH scale (light-to-dark greyscale) for future charting. No chart currently renders in the product — treat it as a reserved, not established, pattern; don't invent chart compositions around it.

### Named Rules

**The One Accent Rule.** Never more than one of Altitude Blue or Thermal Amber is the dominant color on a given screen; the other, if present, stays confined to a single small accent (an icon, a badge).

**The Soft Status Rule.** Success and destructive states are always applied as a ~10-15% tint (`bg-{color}/10`) with full-strength text/icon color, never as a solid alarm-colored fill — status should register calmly, not urgently.

## Typography

**Body Font:** Plus Jakarta Sans (variable, weights 200-800), self-hosted from `./fonts/plus-jakarta-sans-variable-latin.woff2` — no Google Fonts or other font CDN, by explicit decision (`layout.tsx`). One family for every role; there is no separate display or mono face in active use.

**Character:** A single humanist sans carries the whole hierarchy through weight and size alone — restrained rather than expressive, legible outdoors in bright daylight.

### Hierarchy

- **Headline** (600, 1.875rem/30px, tight tracking): page titles (`PageHeader` h1). Appears once per screen.
- **Display** (700, 1.5rem/24px, tabular-nums, tight tracking): the single emphasized number on a stat tile (`StatCard`) — flight count, total airtime. Bolder than headline despite being smaller: role over raw size.
- **Title** (500, 1rem/16px): card and section titles (`CardTitle`).
- **Body** (400, 0.875rem/14px, 1.5 line-height): all running text, form labels, list content.
- **Label** (400, 0.875rem/14px, muted-foreground color): secondary/metadata text — timestamps, descriptions, helper text. Same size as Body; distinguished by color alone, not size.

### Named Rules

**The Color-Not-Size Rule.** Secondary text (Label) is never shrunk to signal lower importance — it drops to `text-muted-foreground` at the same `text-sm` size as Body. Hierarchy comes from weight and color, not from a shrinking type scale.

## Layout

Mobile-first, single column throughout; desktop adapts the same components rather than introducing a distinct layout. Target mobile width: 390-430px.

**Shell:** `h-svh overflow-hidden` on the outer frame — only the content column scrolls, chrome never does. Below `md`: a minimal top bar (logo + city + theme/locale/account) and a fixed bottom tab bar (`MobileBottomNav`, safe-area-aware bottom padding). At `md` and above: the top bar and bottom tab bar are replaced by a persistent `240px` (`w-60`) left sidebar carrying logo, full navigation, theme/locale toggles, and account menu.

**Content column:** `max-w-3xl` (768px), horizontally centered (`mx-auto`), page padding `p-4 md:p-6` (16px mobile / 24px desktop), with `pb-24` on mobile to clear the fixed bottom tab bar. Content never spans wider than this column, even on large desktop viewports — the app stays a single reading/entry column, not a dashboard grid.

**Rhythm:** primary vertical spacing between page sections is `space-y-6` (24px); secondary spacing within a section is `space-y-4` (16px). Card internal padding is `24px` by default, `16px` for the compact `size="sm"` card variant (used by `StatCard`).

**Stat tiles:** laid out as a responsive grid (`grid-cols-2`/`grid-cols-3` depending on count), each tile a compact `Card`, never a single card with multiple stacked metrics.

## Elevation & Depth

Almost flat. Resting surfaces (cards, activity rows, empty states) carry only `shadow-sm` plus a 1px border — enough to read as a distinct surface without visual weight. Depth is reserved for transient, floating UI: dropdowns/selects use `shadow-md` plus a `ring-1 ring-foreground/10` hairline instead of a heavier shadow; sheets/drawers use `shadow-lg`. Nothing in the system uses a shadow purely for decoration or brand — every shadow present corresponds to a surface that is genuinely floating above the page.

### Shadow Vocabulary

- **Resting** (`shadow-sm`): cards, activity list rows, empty states — default state for anything sitting on the page.
- **Floating** (`shadow-md` + `ring-1 ring-foreground/10`): select/combobox popups, dropdown menus.
- **Overlay** (`shadow-lg`): sheets and drawers, the deepest layer in the system.

### Named Rules

**The Ambient-Only Rule.** Shadows exist only to lift something that is actually floating above the page (a popup, a sheet). Static, in-flow content never gets a shadow heavier than `shadow-sm`.

## Shapes

Radius scales with a surface's size and importance, derived from a single `--radius: 10px` base (Tailwind theme scale: `sm` 6px → `md` 8px → `lg` 10px → `xl` 14px → `2xl` 18px). Controls (buttons, inputs, selects) use `lg` (10px); icon badges and nav-item highlight states use `xl` (14px); cards, activity rows, and empty states use the most generous step in active use, `2xl` (18px). Nothing in the system uses a sharp corner or a fully circular container — the softest, most generous radius is reserved for the largest surfaces.

## Components

### Buttons

- **Shape:** `rounded-lg` (10px), 32px height at default size (`h-8`), border-transparent.
- **Primary:** `bg-primary` / `text-primary-foreground`, hover deepens to 80% opacity of the same blue (no color-shift, no darken-via-different-hex).
- **Destructive:** soft-tinted, `bg-destructive/10 text-destructive`, not a solid fill — consistent with the Soft Status Rule.
- **Outline / Ghost / Secondary / Link:** all share the same shape and press behavior; they differ only in resting background (transparent-with-border, transparent, `bg-secondary`, and no-background-underlined-text respectively).
- **Press feedback:** `active:translate-y-px` — every button nudges down 1px on press, the system's one tactile flourish, present even though the rest of the system stays restrained.
- **Focus:** `ring-3` at `ring-color/50` plus a solid border in the ring color — one consistent focus treatment reused by buttons, inputs, and selects alike.

### Cards / Containers

- **Corner Style:** `rounded-2xl` (18px).
- **Background:** `bg-card` (Pure White / Deep Slate), 1px border, `shadow-sm`.
- **Internal Padding:** 24px default, 16px for the compact `size="sm"` variant.
- **Footer treatment:** when present, a card footer gets `bg-muted/50` and a top border, visually separating summary/action content from the card body.

### Inputs / Fields

- **Style:** `rounded-lg`, 1px `border-input`, transparent background, 32px height, base text size on mobile stepping down to `text-sm` at `md` and above (prevents iOS auto-zoom on focus while staying compact on desktop).
- **Focus:** same ring treatment as buttons (`ring-3` + solid border in ring color).
- **Error:** `aria-invalid` swaps the border to `border-destructive` and the ring to a soft `ring-destructive/20` — status stays tinted, never solid, matching the Soft Status Rule.
- **Disabled:** reduced opacity plus a faint tinted background (`bg-input/50`), never fully hidden affordance.

### Navigation

- **Desktop (`≥md`):** persistent 240px left sidebar. Inactive items: `text-muted-foreground`, icon + label, `rounded-xl` hover highlight in `sidebar-accent`. Active item: `bg-primary/10 text-primary`, `font-medium`, `rounded-xl`, plus `aria-current="page"`.
- **Mobile (`<md`):** fixed bottom tab bar, icon above label, `text-xs`. Active: `text-primary font-medium`. Safe-area-aware bottom padding for notched devices.
- Both variants read the same active-state color rule (`text-primary`, medium weight) — only position and icon/label arrangement change between breakpoints.

### Tinted Icon Badges (signature pattern)

The system's most-repeated motif: a small square badge (`rounded-lg` or `rounded-xl`, `size-8`/`size-9`) with a 10-15% opacity tint of a semantic color as background and the full-strength color as icon tint (`bg-primary/10 text-primary`, `bg-accent/15 text-accent`, `bg-muted text-muted-foreground`). Used identically for activity-type glyphs (flight/training-camp/ground-handling), stat-tile icons, and anywhere a Lucide icon needs a colored container. Never a solid-fill icon badge.

### Ambient Arc (signature background)

A fixed, full-viewport, `-z-10`, `pointer-events-none` layer of three overlapping green radial gradients anchored to the bottom of the screen, fading to `transparent` (not to the theme background), present on every authenticated screen behind `AppShell`. Because it fades to transparent rather than a hardcoded color, it adapts to light/dark mode automatically through whatever `bg-background` shows behind it. Reads as a distant mountain silhouette at dusk. Uses a green distinct from and unrelated to the `success` token — this green is purely decorative and must never be reused as if it were the semantic success color, or vice versa.

## Do's and Don'ts

### Do:

- **Do** keep primary (Altitude Blue) and accent (Thermal Amber) identical across light and dark mode — they are the one deliberate constant.
- **Do** apply the Tinted Icon Badge pattern (`bg-{color}/10-15 text-{color}`) for any new icon that needs a colored container, rather than a solid fill.
- **Do** keep status colors (success, destructive) soft-tinted, never solid/alarming, per the Soft Status Rule.
- **Do** reuse the single `ring-3 ring-{color}/50` + solid border focus treatment for any new interactive control.
- **Do** keep new content inside the `max-w-3xl` single-column shell; build desktop by adapting existing components, not by introducing a separate wide-screen layout.

### Don't:

- **Don't** introduce a second saturated accent color; the One Accent Rule caps the system at Altitude Blue + Thermal Amber.
- **Don't** add gradients, glassmorphism, or neon effects — explicitly rejected in `docs/ui-directions.md`, and absent from every screen shipped so far (the Ambient Arc's soft radial fade is the one intentional exception, not a precedent for more).
- **Don't** add a shadow to static, in-flow content (cards, rows) heavier than `shadow-sm` — depth is reserved for genuinely floating surfaces.
- **Don't** reuse the Ambient Arc's decorative green as if it were the `success` semantic token, or vice versa — they are deliberately distinct despite the shared hue family.
- **Don't** load a font from Google Fonts or any other CDN — Plus Jakarta Sans is self-hosted by explicit decision.
- **Don't** design toward a "sport extrême" or financial-dashboard aesthetic — high-density metrics, aggressive color, or urgency cues work against the calm, personal-logbook character this system commits to.
