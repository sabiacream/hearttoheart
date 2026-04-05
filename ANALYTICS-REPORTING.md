# Heart to Heart 111 — analytics reporting reference

Practical guide for building dashboards from existing `h2hFunnel` events (see **`ANALYTICS-FUNNEL.md`** for definitions and payloads). No new tracking is required.

Use **unique users/sessions** (or your tool’s equivalent) as the denominator unless you explicitly want event counts.

---

## Core funnel (happy path)

Order reflects the intended journey after landing on the reading experience:

| Step | Event | Role |
|------|--------|------|
| 1 | `password_gate_view` | Gate shown (session not yet unlocked). |
| 2 | `password_success` | Gate passed. |
| 3 | `hero_cta_click` | User enters the ritual flow (`entry`: `hero_primary` or `mobile_sticky`). |
| 4 | `category_selected` | Topic chosen (may fire multiple times if they change category). |
| 5 | `spread_selected` | Spread size chosen (same note). |
| 6 | `preview_ready` | Draw complete; paywall / summary visible. |
| 7 | `unlock_full_reading_click` | User commits to paid unlock (tap before API). |
| 8 | `paypal_checkout_start` | Checkout session OK; PayPal URL opened. |
| 9 | `paypal_checkout_success` | Payment confirmed. |

**Optional steps (not in the table above but in the whitelist):** `charm_selected`, `preview_first_click`, `restore_submit` / `restore_success` — use for depth analysis, not required for the nine-step core view.

---

## Diagnostic side branches

Use these to explain drop-off, friction, and support load — not as sequential funnel steps.

| Event | Use |
|-------|-----|
| `password_failure` | Failed gate attempts vs `password_success`. |
| `paypal_checkout_init_failure` | Could not create/open checkout (before PayPal). Props: `reason`, `message`. |
| `paypal_checkout_cancel` | Buyer returned via cancel URL (`cancelled=1`). |
| `paypal_checkout_return_error` | Return URL carried `paypal_error` (e.g. capture failure). Props: `reason`, `paypal_error`. |
| `restore_failure` | Restore page: empty ID, invalid format, or not found (`reason`). |

---

## Suggested derived metrics

Define a **cohort window** (e.g. same session / same day / 7 days) so numerators and denominators align.

| Metric | Suggested definition | Notes |
|--------|----------------------|--------|
| **Preview rate** | `preview_ready` ÷ `password_success` (or ÷ `hero_cta_click` if you exclude gate) | Gate skews “top of funnel”; pick one baseline and keep it consistent. |
| **Unlock click-through rate** | `unlock_full_reading_click` ÷ `preview_ready` | Share of users who saw the paywall and tapped unlock. |
| **Checkout completion rate** | `paypal_checkout_success` ÷ `paypal_checkout_start` | Among those who got a live checkout. |
| **Cancel rate** | `paypal_checkout_cancel` ÷ `paypal_checkout_start` | Buyer-initiated cancel after checkout opened. |
| **Technical failure rate** | `paypal_checkout_init_failure` ÷ `unlock_full_reading_click` | Pre–PayPal failures per unlock intent. Optionally add return errors: `(paypal_checkout_init_failure + paypal_checkout_return_error) ÷ paypal_checkout_start` for “failed after start” views — label clearly. |
| **Restore success rate** | `restore_success` ÷ `restore_submit` | On the restore page only (`source_page: 'restore'`). |

**Preview engagement (optional):** `preview_first_click` ÷ `preview_ready` — sampled full reading before pay.

---

## Suggested breakdowns

Reading-flow events from **`h2hFunnelContext()`** (see **`ANALYTICS-FUNNEL.md`**) already carry:

| Dimension | Property | Tip |
|-----------|----------|-----|
| Category | `category` | Filter `''` or “unknown” if needed. |
| Spread size | `spread` or `spread_cards` | Redundant; pick one in the tool. |
| Cards in play | `cards_drawn` | Useful on `preview_ready` / payment events. |
| Moon optional | `has_moon` | `true` / `false`. |
| Zodiac optional | `has_zodiac` | `true` / `false`. |

Apply breakdowns to: `category_selected`, `spread_selected`, `preview_ready`, `unlock_full_reading_click`, `paypal_checkout_start`, `paypal_checkout_success`, and PayPal diagnostic events (context is attached there too).

**Hero entry:** segment `hero_cta_click` by `entry` (`hero_primary` vs `mobile_sticky`).

**Restore:** events only include `source_page` and `reason` — no category/spread breakdown unless you join to other data.

---

## Implementation notes

- Events are forwarded via **`h2hTrack`** to GA4 / GTM / Plausible depending on what you load; parameter names match the payloads above (GA4 uses `event_category: 'tarot_funnel'` plus flat params).
- **`H2H_FUNNEL`** in `analytics.js` lists every whitelisted name.
- Debug: `localStorage.setItem('h2h_debug_analytics','1')` and watch the console for `[h2hTrack]` / `[h2hFunnel]`.
