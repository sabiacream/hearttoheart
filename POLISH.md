# Final polish pass — summary

This document records the site-wide polish applied for ambient motion, focus visibility, contrast, scrolling, preloads, social meta, keyboard flow, and responsive layout.

## 1. Global ambient layer

- Added **`assets/css/polish.css`** (imported from **`assets/css/base.css`**) defining **`.h2h-ambient-layer`**: a fixed, full-viewport layer at `z-index: 0` with:
  - Soft **drifting radial gradients** (`transform: translate3d` + `scale`, ~82s alternate) for a GPU-friendly glow.
  - A subtle **“star field”** using **animated `background-position`** on small radial dots (~145s linear), which avoids per-particle DOM cost.
- **`animation: none`** under **`prefers-reduced-motion: reduce`** for both the layer and its `::after`.
- Inserted **`<div class="h2h-ambient-layer" aria-hidden="true"></div>`** as the first child of **`<body>`** on **`index.html`** and all inner pages (**`about.html`**, **`contact.html`**, **`faq.html`**, **`restore.html`**, **`terms.html`**).
- Raised **`.hbg`** to **`z-index: 1`** and **`.wrap`** to **`z-index: 2`** in **`index.html`** critical CSS and **`h2h-deferred.css`** so ambient sits **under** floating hearts and main content.

## 2. `:focus-visible` (gold, ≥3:1)

- **`polish.css`**: default **gold ring** `#e8cf7a` plus **dark halo** `rgba(7, 5, 13, 0.88)` for non-text contrast; **parchment / parlor-panel / password panel** use a **darker gold** `#b8892e` with a **light halo** for contrast on cream.
- **`base.css`**: removed duplicate focus rules so **`polish.css`** is the baseline for pages using `base.css`.
- **`h2h-deferred.css`**: replaced **`var(--focus-strong)`**-based outlines with the same **gold + halo** pattern across links, buttons, inputs, ritual controls, tarot **`.tc`**, chest, preview chips, etc.; aligned **`.pw-gate__input:focus-visible`** and **`.pw-gate__submit:focus-visible`** with a visible ring; fixed **`.ritual-skymap-field .ritual-select-wrap:focus-within`** so two `box-shadow` lines are not overwritten.

## 3. Color contrast (WCAG AA on dark)

- **`assets/css/design-system.css`**: **`--ink-soft`** and **`--ink-muted`** are now **solid** **`#e2dcd2`** / **`#c4bbb1`** so body copy on **`--bg`** (~`#0a0812`) targets **~4.5:1** for normal text where those tokens apply.
- **`h2h-deferred.css`**: **`.pw-gate__hint`** raised from **`rgba(247,242,234,.48)`** to **`.68`** for better contrast on the gate background.
- **`assets/css/inner-pages.css`**: **`body.inner-parlor`** default text **`.72 → .84`**; footer **`.fdi`** **`.32 → .55`** on the dark footer.

*Note:* The marketing **`index`** shell still uses **`--final-ink`** / **`--final-muted`** on **parchment** in the hero; those pairings were already in a readable range. Social cards using **`Back.jpg`** are decorative; for **1.91:1** feed crops, a dedicated **1200×630** asset is still recommended (see below).

## 4. Smooth scroll & `scroll-margin-top`

- **`polish.css`**: **`html { scroll-behavior: smooth }`** with **`auto`** when **`prefers-reduced-motion: reduce`**; **`scroll-margin-top: var(--h2h-scroll-margin)`** on common **`main` / `section` / article** targets and home anchors (**`#s1`**, **`#home-guide`**, **`#reading-flow`**, **`#visit-studio`**, **`#studio-reviews`**).
- **`index.html`** critical **`html`**: added **`scroll-behavior: smooth`** and a **reduced-motion** override.
- **`inner-pages.css`**: **`scroll-padding-top`** on **`html`** now uses **`var(--h2h-scroll-margin, …)`** to align with the same anchor offset.

## 5. Preloads (display font & card back)

- **`index.html`**: **`preconnect`** to **`fonts.googleapis.com`** and **`fonts.gstatic.com`** (crossorigin); **`<link rel="preload" href="tarot-images/Back.jpg" as="image" fetchpriority="high">`** before the main font stylesheet.
- **Inner pages**: same **preconnect** + **`preload`** for **`tarot-images/Back.jpg`** (shared asset path from site root).
- **Display face (Cormorant Garamond)** is still delivered via the existing Google Fonts stylesheet; **gstatic preconnect** reduces connection latency. A direct **`.woff2` `preload`** was not added to avoid brittle versioned URLs.

## 6. Meta: `og:*`, `theme-color`

- **`theme-color`** set to **`#0a0812`** on **`index.html`** (was cream) and on **about / contact / faq / restore / terms**.
- **`og:title`**, **`og:description`**, **`og:image`**, **`og:type`**, **`og:locale`** added or updated on inner pages; **`index`** **`og:image` / Twitter image** now point to **`https://hearttoheart111.com/tarot-images/Back.jpg`** with **`og:image:width` 600** and **`height` 1000**.
- **JSON-LD** **`image`** on the LocalBusiness block updated to the same **Back.jpg** URL.

*Recommendation:* Many platforms prefer **1200×630** Open Graph images. **`Back.jpg`** satisfies the “tarot card” request; consider **`images/og-share.png`** (or similar) later for ideal crop previews.

## 7. Keyboard-only: password gate → unlock

- Existing behavior retained: **focus trap** inside **`#pw-gate`**, **skip links** **`tabindex="-1"`** while the gate is active, **initial focus** on **`#pw-input`**, **success** moves focus to **`#main-content`**, **ARIA** on the dialog.
- Focus rings on **`.pw-gate__input`** / **`.pw-gate__submit`** were strengthened (see §2) so keyboard users always see a clear **gold** indicator.

## 8. Responsive checks (320 / 768 / 1280 / 1920)

- **`polish.css`**: **`body { overflow-x: clip }`**, **`min-width: 0`** on **`.wrap`**, **`main.parlor-panel`**, **`.tnav-in`**; **`overflow-wrap: anywhere`** on common text blocks; **≤360px** extra horizontal **safe-area** padding on **`.wrap`** (index).
- **`inner-pages`**: **`tnav` `z-index: 22`**, **`footer.site-footer` `z-index: 2`** so stacking stays correct above the ambient layer.

No automated visual regression was run in-repo; layout was adjusted against common overflow causes (sticky nav, long URLs, narrow viewports).

## Files touched (reference)

| Area | Files |
|------|--------|
| Polish + import | `assets/css/polish.css`, `assets/css/base.css` |
| Tokens | `assets/css/design-system.css` |
| Inner pages | `assets/css/inner-pages.css`, `about.html`, `contact.html`, `faq.html`, `restore.html`, `terms.html` |
| Home + funnel | `index.html`, `h2h-deferred.css` |
