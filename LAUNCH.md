# Heart to Heart 111 — pre-launch QA (April 2026)

## 1. Pages, console, assets, internal links

**Scope:** Production HTML served by the app: `/` (`index.html`), `about.html`, `contact.html`, `faq.html`, `restore.html`, `terms.html`. (Legacy files such as `index_old.html` / `index_tarot_authentic_art.html` were not used for this gate.)

**Method:** Automated crawl with Playwright (`qa/launch-check.mjs`) against `http://127.0.0.1:8787` with:

- Console `error` / `warning` and `pageerror` collection  
- `requestfailed` monitoring  
- Static verification that same-origin `a[href]`, `img[src]`, and `link[href]` targets exist under the repo root  

**Result:** After the fixes below, **no console errors**, **no failed requests**, and **no broken internal asset/link targets** on the pages above.

**Fixes applied during QA**

- Removed `<source type="image/webp">` entries that pointed at **missing** `.webp` files (hero + studio + about imagery). JPEGs remain the single source of truth until WebP assets exist.  
- Set `CARD_IMAGE_EXTENSIONS` in `index.html` to **`['jpg','jpeg','png','svg']`** so the reading flow no longer probes **`Back.webp`** (which caused a 404 after unlock when warming the shared back image).

## 2. Password → reading flow → PayPal → restore

**Password**

- Confirmed **`tarot2026`** matches the SHA-256 check in `checkPw()` (`ef5e9fb7860d070e42ed03ce439df2822aaa1d376550c11094055da0378e2aab`).  
- Playwright: gate **`display: none`**, `sessionStorage.pw-ok === '1'`, no JS errors.

**Reading flow & PayPal**

- The full ritual (question → charm → spread → deal → preview) is large client-side state; it was **not** fully driven in automation for this checklist.  
- **`pay()`** calls `POST /api/create-checkout` and opens PayPal when the server returns `checkoutUrl`. With **no PayPal env vars**, the API responds **500** + `paypal_not_configured` and the UI shows the mapped user-facing message — **expected on a dev box**.  
- **Production:** With `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and a valid `APP_BASE_URL`, checkout and return-url handling in `index.html` are the intended path.

**Restore**

- `restore.html` loads, posts to the restore API, and links back to `index.html`. **End-to-end restore** requires a real stored reading keyed by a PayPal transaction ID — **not exercised** here without a live payment.

## 3. Tarot images (79 files)

**Count:** `tarot-images/` contains **79** image files (**78** card faces + **`Back.jpg`**), verified with `find tarot-images -maxdepth 1 -type f`.

## 4. Lighthouse (index, mobile simulated)

**Command (representative):**

`npx lighthouse@11.7.1 http://127.0.0.1:8787/ --only-categories=performance,accessibility,best-practices,seo --output=json`

**Latest scores (after non-redesign perf tweaks):**

| Category        | Score |
|----------------|-------|
| Performance    | **65** |
| Accessibility  | **100** |
| Best Practices | **100** |
| SEO            | **100** |

**Perf tweaks applied (no layout redesign)**

- **Non-blocking fonts:** removed render-blocking `@import` of Google Fonts from `assets/css/design-system.css`; added a shared **async** font stylesheet (`preload` + `onload` + `noscript` fallback) on all live HTML pages.  
- **`compression` middleware** in `server.js` for gzip/deflate on responses (restart the Node server to pick this up).

**Why Performance stays under 90**

- **LCP** is dominated by **large full-resolution JPEG** hero / card art and a **very large inline script** on `index.html`. Reaching **≥90** without a visual redesign would still require a substantial **image derivative pipeline** (responsive sizes, modern formats, CDN) and/or **JS splitting** — out of scope for this pass.

Raw JSON from the last run is written to **`qa/lighthouse-index.json`** (regenerate locally; optional to commit).

## 5. `prefers-reduced-motion`

Verified with Playwright (`reducedMotion: 'reduce'`):

| Target | Result |
|--------|--------|
| Password gate card float (`.pw-gate__card-float`) | `animation-name: none` |
| Ambient symbols (`.hbg .fh`) | `animation-name: none` (see `h2h-deferred.css` global reduce block) |
| Body ambient drift (`body::before` in `assets/css/polish.css`) | No drift layer: `::before` **content none**, **no animation** (drift is scoped to `(prefers-reduced-motion: no-preference)` only) |
| Drawn card hover lift (`#crow .tc.fl:hover` translate) | **Neutralized** in reduce mode (`h2h-deferred.css` `@media (prefers-reduced-motion: reduce)` block for `#crow .tc.fl:hover`) |

## 6. Automation artifact

- **`qa/launch-check.mjs`** — run: `BASE=http://127.0.0.1:8787 node qa/launch-check.mjs` (requires Playwright browsers: `npx playwright install chromium`).

## 7. Git

Commit created with message:

**`Final polish: motion, a11y, meta, responsive QA`**

---

**Operator notes:** Restart **`node server.js`** after pulling so compression is active. For PayPal and restore E2E, use a server with `.env` filled and complete one real checkout, then validate restore with the issued transaction ID.
