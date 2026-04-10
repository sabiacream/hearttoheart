# Responsive pass (Apr 2026)

Breakpoints exercised conceptually: **320px, 375px, 768px, 1024px, 1280px, 1920px**. Desktop layouts at **≥1024px** for grids that use that threshold are unchanged aside from the charm grid column count (see below).

## `h2h-deferred.css`

### Password gate (`.pw-gate`, `.pw-gate__panel`, fan, form)

- **Root:** `overflow-x: hidden` on `.pw-gate` to stop horizontal bleed from the decorative card fan.
- **Panel:** `overflow-x: hidden` on `.pw-gate__panel` so the fan clips inside the rounded panel instead of overflowing.
- **Input / submit:** `min-height: 44px` on `.pw-gate__input` and `.pw-gate__submit`, with `box-sizing: border-box` on the button; slightly increased horizontal padding on the input for a better tap target.
- **Fan (very narrow):** New `@media (max-width: 360px)` tightens fan width and side translations/angles so three backs stay inside the viewport.
- **Stack rhythm:** `@media (max-width: 380px)` adds a slightly lower `padding-top` on `.pw-gate__stack` so the form sits closer under a shorter fan.

### Charm grid (`.tcloud` and `.tcloud.tcloud--velvet`)

- Replaced **3 → 4 → 5** columns with **2 → 3 → 4**:
  - Default: **2** columns.
  - **`min-width: 768px`:** **3** columns.
  - **`min-width: 1024px`:** **4** columns (desktop cap; no fifth column).
- **Removed** the old `@media (max-width: 480px)` override that forced `repeat(auto-fill, minmax(68px, 1fr))`, which could create too many narrow columns on small phones and fight the intended reflow.

### Spread selector (`.sps`)

- Three-up layout now starts at **`min-width: 768px`** (was `600px`), so viewports **&lt;768px** stay a single column of full-width cards (with `max-width: 22rem` centered).
- **`.sps .sp`:** `min-height: 44px` and `box-sizing: border-box` for touch targets.
- Removed the redundant **`@media (max-width: 720px)`** block that duplicated single-column grid rules; narrow centering is handled with a **`767px`** media query.

### Unlock / preview (`.prev-split`, `.prev-unlock-payrow`)

- **`.prev-split`:** single column at **`max-width: 767px`** (was `640px`).
- **`.prev-unlock-payrow`:** column layout for PayPal row at **`max-width: 767px`** (was `599px`), aligned with the **768px** breakpoint used elsewhere.

### Reading flow (`.flow-wrap`, `.flow-progress .pbar`)

- **`.flow-wrap`:** `min-width: 0` and `overflow-x: hidden` to reduce accidental horizontal overflow inside the ritual shell.
- **Progress bar:** `flex-wrap: wrap`, `justify-content: center`, and `overflow-x: visible` at all widths (removed the narrow-only horizontal scroll + `nowrap` pattern) so the five steps wrap instead of scrolling sideways.

### Studio cards (`.studio-cards`)

- **Unchanged:** still stacks to one column at **`max-width: 900px`** (clean stack on phones and small tablets as before).

### Footer (`.site-footer .fln`)

- **`@media (max-width: 767px)`:** tighter, centered wrapping; **44px** min-height tap targets on footer links; `.fln-legal` as a wrapping flex row so “Terms · Privacy · Disclaimer” breaks more evenly and avoids awkward single-link lines where possible.

## `index.html` (critical CSS, `#h2h-critical-css`)

- **`@media (max-width: 480px)`** on the hero:
  - Slightly **smaller watermark** card ghosts (`::before` / `::after`) so they stay more clearly in the corners and compete less with the headline area.
  - **`hero-lede`:** reduced `clamp()` scale and slightly relaxed line-height; small horizontal padding tweak on **`.hero-copy`** so the headline does not crowd the card trio on small phones.

## Intentionally unchanged

- **Hero two-column shell** from **`min-width: 721px`** onward (existing breakpoint preserved).
- **Studio spotlight** (`.studio-spotlight`) still flips to one column at **`720px`** as before.
- **Wide desktop** typography and spacing for nav/hero above **720px** were not redesigned.
