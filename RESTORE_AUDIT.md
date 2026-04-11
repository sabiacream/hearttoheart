# Restore flow & tarot interpretation audit (Heart to Heart 111)

This document summarizes how the written tarot interpretation is produced after payment, how readings are persisted, how `restore.html` works, and why a restored reading may not match the original session word-for-word. **No code was changed** for this audit; line numbers refer to the repository state when the audit was written.

---

## 1. How the full written interpretation is generated (after flip + pay)

### Primary functions (file: `index.html`)

| Location | Role |
|----------|------|
| **`unlock(txid, source)` — ~4087–4107** | Runs after successful payment (or session restore). Sets `activeTxId`, calls **`buildReadingHtml(ctx, false)`**, assigns the result to `#rc`, calls **`saveReadingByTxId(activeTxId)`**, and shows the full-reading region (`#frd`). |
| **`buildReadingHtml(ctx, previewMode)` — ~4045–4071** | Assembles the HTML for preview (`previewMode === true`) or the paid full reading (`false`). It pulls together **`buildOverview`**, per-card **`buildCardInterpretation`**, and **`buildClosing`**, plus **`buildReadingHighlights`** for chips / “at a glance” blocks. |
| **`buildCardInterpretation(card, position, ctx, index)` — ~3446–3506** | Composes long-form prose from many template pools (`TOPIC_OPENERS`, `PREMIUM_OPENERS`, `POSITION_DEPTH`, trinket lines, suit lines, question lines, neighbor lines, `INTEGRATION_LINES`, etc.). Card meanings use **`card.up` / `card.rev`** from the in-page deck data (`meaning=`). |

### How is the text produced?

- **Not** from a single static JSON map keyed only by card name for the main site reading. The main reading uses **large template libraries** and **per-card structured fields** (upright/reversed meanings, suit, position, category, trinket, question signals, neighbors, etc.). Some sections use **`seededPick(arr, key)`** (~2478–2481) to choose among several variant strings for the same logical slot.
- **Not** “random fills” in the sense of `Math.random()` picking wording at unlock time. Wording variants are chosen **deterministically** from **`readingSalt`**: `seededPick` uses a string hash (`hashString`, ~2464–2471) of `` `${readingSalt}|${key}` `` modulo array length.
- **No** LLM / external text API: there are **no** calls to Anthropic, OpenAI, or similar for interpretation text. **`fetch`** in `index.html` is used for **payment** endpoints (`/api/create-checkout`, `/api/payment-status`, `/api/checkout-session`) only.
- **`readingSalt`** is created once when the spread is prepared in **`doReveal()`** (~3745): `readingSalt = makeReadingSalt({...ctx, drawSignature: buildDrawSignature(drawn)})`. **`makeReadingSalt`** (~2473–2476) concatenates **`Date.now()`**, **`Math.random()`**, optional **`crypto.getRandomValues`**, plus category, trinket, question, and draw signature — so **entropy is introduced at draw time**, not at payment. After that, **`seededPick`** / **`hashString`** are deterministic for a fixed `readingSalt` and keys.

### Randomness vs. the “text-generation step” after payment

- **Card drawing** uses **`Math.random()`** (e.g. shuffle / weighted draw ~3159–3186) — that is separate from unlock.
- **After pay**, **`unlock` → `buildReadingHtml`** does **not** call `Math.random()` for copy; it relies on **`readingSalt`** already on the page. So there is **no extra randomness in the unlock/build step** beyond whatever was already fixed when the user revealed the spread.

---

## 2. Where a paid reading is persisted and what is saved

### Browser `localStorage` (`index.html`)

| Line (approx.) | Key / pattern | Contents |
|----------------|---------------|----------|
| ~1221 | **`h2h_checkout_${sessionId}`** (`checkoutStoreKey`) | Checkout snapshot: `sessionId`, `cat`, `chosenT`, `spN`, **`readingSalt`**, **`drawn`**, `savedAt`. Written in **`saveCheckoutSnapshot`**. |
| ~1611 | **`h2h_${normalizedTxId}`** | **`buildReadingRecord()`** output: `question`, `category`, `trinket`, `spread` (card count), **`cards`** (name, symbol, numeral, position label), **`created_at`**. Does **not** include **`readingSalt`** or full HTML/text. |
| ~3210 | **`h2h_recent_draw_signatures_v1`** | Recent draw signature strings — used to vary repeated physical draws, **not** the prose of a specific paid reading. |
| ~3932 | **`h2h_last_txn`** | Last PayPal **order/transaction id** string for UX hints on restore. |

### Browser `sessionStorage` (`index.html`)

| Line (approx.) | Key | Contents |
|----------------|-----|----------|
| ~372 | **`pw-ok`** | Password-gate flag for the main page — **unrelated** to reading content. |

### Server (`server.js` + `data/paypal-session-store.json`)

- **`POST /api/create-checkout`** (~44–213): **`upsertSession(sessionId, { draft, preview, orderId, ... })`**. **`draft`** comes from the client (`question`, `category`, `trinket`, `spread`). **`preview`** includes client fields such as **`cat`**, **`chosenT`**, **`spN`**, **`readingSalt`**, **`drawn`** (see client **`buildPaymentPayload`** ~1584–1591).
- **`GET /api/checkout-session`**: Returns session **`draft`**, **`preview`**, **`transactionId`** (~271–286).
- **`GET /api/payment-status`**: Polls / resolves paid state; returns **`transactionId`** (~215–268).
- **`GET /api/restore-reading`**: Looks up session by **PayPal transaction id**, returns **`buildRestoredReading(session, txid)`** (~289–305) — see section 3.
- Persistence implementation: **`writeStore`** / **`readStore`** (~683–697) → **`data/paypal-session-store.json`** on disk (not Cloudflare KV/D1 in this repo).

### Not used for this flow (in repo HTML/JS)

- **IndexedDB**: No project `indexedDB` usage found outside dependencies.
- **Workers**: No reading persistence via workers found in the audited files.

---

## 3. `restore.html`: path from “paste transaction ID” to “reading appears”

1. **User action**: Clicks “Restore my reading” → **`restore()`** (~167–253).
2. **Validation**: Trims/uppercases ID; regex **`/^[A-Z0-9-]{8,40}$/`**; empty/invalid shows inline errors.
3. **Primary lookup**: **`fetch('/api/restore-reading?txid=' + encodeURIComponent(txid), { cache: 'no-store' })`** (~197–198). If **`r.ok`**, **`data = await r.json()`**.
4. **Fallback**: If no JSON from API, **`localStorage.getItem('h2h_' + txid)`** (~204–205) — supports older **device-local** saves.
5. **Failure**: Shows **`#errBox`** with “couldn’t find a reading…” (~214–220).
6. **Success**: Builds HTML into **`#rc`**: title, optional **`created_at`** (formatted with **`toLocaleDateString`**) + trinket, optional question, then **for each card** uses **`INTERP[card.name]`** (~128–129, ~235–237) — a **short static blurb per Major Arcana name** — plus a **“Closing Guidance”** block from local **`CAT_CLOSE`** + trinket suffix (~240–242).
7. **Auto-restore**: URL query **`tx`** / **`transactionId`** or hash (~264–268) pre-fills the field and **`setTimeout(restore, 400)`**. Else **`h2h_last_txn`** may pre-fill the input (~274–278).

**Important**: This page does **not** load `index.html`’s `buildReadingHtml` / `buildCardInterpretation`. It does **not** re-run the main site’s interpretation engine.

### Server side of `/api/restore-reading` (`server.js` ~289–305, `buildRestoredReading` ~769–791)

- Finds the checkout **session** whose **`transactionId`** matches the query.
- Builds a JSON object: **`txid`**, **`created_at`** (from **`paidAt` / session timestamps**), **`question`**, **`category`**, **`trinket`**, **`spread`**, **`cards`** — each card: **`name`**, **`symbol`**, **`position`** (from **`SPREAD_POSITIONS`**). **`reversed` is not included** in this payload.
- Does **not** return stored prose or **`readingSalt`**.

---

## 4. Architecture classification (A / B / C)

**Best fit: B — inputs (and a rich draw snapshot on the server) are stored; the user-visible interpretation on the restore page is rebuilt from a separate, simpler template layer — not the verbatim full reading from the home page.**

- **Not A**: The server JSON store and **`buildReadingRecord()`** do **not** persist the **full multi-paragraph interpretation string** from `index.html`. The restore page reconstructs **different** copy.
- **Not C**: Cross-device restore is intended via **`/api/restore-reading`** backed by **`paypal-session-store.json`**, not only same-device `localStorage`.
- ** nuance**: On **`index.html`**, after payment, the “true” full text exists only in the DOM until refreshed; **`h2h_${txid}`** still omits full HTML. The **canonical rich text** is produced only by the main page’s JS with **`readingSalt` + `drawn`**.

---

## 5. Why a restored reading is usually NOT word-for-word identical to the original

### Primary reason (structural)

- **Different rendering pipeline**: The original full reading is **`buildReadingHtml` → `buildCardInterpretation` / `buildOverview` / `buildClosing`** in **`index.html`**. **`restore.html`** renders **short `INTERP[card.name]` strings** plus a compact closing — **not** the same templates, length, or structure (~226–242 in `restore.html` vs ~4045+ in `index.html`).

### Secondary / contributing reasons

- **`readingSalt` is not part of `buildReadingRecord()`** (~1594–1605), so the **`h2h_${txid}`** local record cannot replay **`seededPick`** choices even if the client tried to reuse `index` logic.
- **Server `buildRestoredReading`** does not expose **`readingSalt`** (or full **`drawn`** reversal data) to **`restore.html`**, so the restore page cannot call the same **`buildCardInterpretation`** without additional API fields and shared script.
- **Timestamps**: **`created_at`** for local save is **`new Date().toISOString()`** at unlock (~1604); server restore uses **`paidAt`** / session times (~785) — the displayed date line can differ.
- **Locale formatting**: Restore uses **`toLocaleDateString('en-US', …)`** (~230) — could differ from any date display on the main page in edge cases.
- **Not** caused by: LLM temperature, or `Math.random()` during the unlock step (unlock uses fixed `readingSalt` for `seededPick`).

### What is *not* indicated by this codebase

- No evidence of **API-based prose generation** for readings.
- **IndexedDB / Cloudflare KV / D1** are not part of the audited persistence path in this repository.

---

## Quick reference: main entry points

| Concern | File:lines |
|---------|------------|
| Full reading HTML after payment | `index.html` ~4087–4107 (`unlock`), ~4045–4071 (`buildReadingHtml`) |
| Deterministic variant choice | `index.html` ~2464–2481 (`hashString`, `seededPick`) |
| Salt for variants (set at reveal) | `index.html` ~2473–2476, ~3745 |
| Payload sent to server at checkout | `index.html` ~1584–1591 (`buildPaymentPayload`) |
| localStorage by transaction id | `index.html` ~1608–1612 (`saveReadingByTxId` / `buildReadingRecord`) |
| Restore UI + API + local fallback | `restore.html` ~167–253, ~195–207 |
| Server restore JSON shape | `server.js` ~769–791 (`buildRestoredReading`) |
