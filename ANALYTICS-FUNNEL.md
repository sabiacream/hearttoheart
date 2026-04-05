# Heart to Heart 111 — funnel analytics

## Helper API

| Function | Role |
|----------|------|
| `h2hFunnel(eventName, props?)` | **Use for funnel steps.** Only forwards whitelisted `eventName` values to `h2hTrack`. No-op if `analytics.js` did not load or name is unknown. |
| `h2hTrack(eventName, props?)` | Low-level forwarder to `gtag` / `plausible` / `dataLayer`. Safe no-op if no provider. Still used for optional non-funnel events (e.g. `question_entered`). |
| `H2H_FUNNEL` | Frozen map of logical keys to string event names (same as values), for reference in code or tooling. |

**Index reading context:** `h2hFunnelContext(extra?)` in `index.html` builds a **stable, minimal** payload merged into most reading/payment funnel calls:

| Property | Type | Meaning |
|----------|------|--------|
| `source_page` | string | Always `'index'` for the main reading app. |
| `category` | string | Selected reading category (`''` if none yet). |
| `charm` | string | Selected charm id (`''` if none). |
| `spread` | number | Spread size (card count), same as `spN`. |
| `spread_cards` | number | Same as `spread` (explicit for dashboards). |
| `cards_drawn` | number | Length of `drawn` at event time. |
| `has_moon` | boolean | Moon phase `<select>` has a non-empty value. |
| `has_zodiac` | boolean | Zodiac `<select>` has a non-empty value. |

`extra` object values override or add fields (e.g. `reason`, `message`, `entry`). Strings are truncated in `h2hTrack` (max 120 chars per value).

**Restore page:** events use `{ source_page: 'restore', ... }` only (no reading context).

**Debug:** `localStorage.setItem('h2h_debug_analytics','1')` then open the console.

---

## Event map

| Event name | Meaning | Where it fires | Typical props |
|------------|---------|----------------|---------------|
| `password_gate_view` | Password gate shown on first load | `index.html` `DOMContentLoaded` when session not unlocked | `{ source_page: 'index' }` |
| `password_success` | Correct gate phrase | `index.html` `checkPw()` | `{ source_page: 'index' }` |
| `password_failure` | Wrong gate phrase | `index.html` `checkPw()` | `{ source_page: 'index' }` |
| `hero_cta_click` | Entry into reading flow | Hero primary button; mobile sticky CTA | `{ source_page: 'index', entry: 'hero_primary' \| 'mobile_sticky' }` |
| `category_selected` | Category chip changed | `chooseCategory()` | `h2hFunnelContext()` |
| `charm_selected` | Charm changed | `pickT()` | `h2hFunnelContext()` |
| `spread_selected` | Spread size changed | `setSp()` | `h2hFunnelContext()` |
| `preview_ready` | Paywall / summary panel opens after draw | `showPrev()` | `h2hFunnelContext()` |
| `preview_first_click` | User taps “Preview first” | `previewUnlock()` | `h2hFunnelContext()` |
| `unlock_full_reading_click` | User taps unlock / PayPal primary CTA | start of `pay()` | `h2hFunnelContext()` |
| `paypal_checkout_start` | Checkout session created; URL opened | `pay()` after `createCheckoutSession()` resolves | `h2hFunnelContext()` |
| `paypal_checkout_success` | Payment confirmed | `checkPaymentStatus()` paid path; `resumeCheckoutFromUrl()` success + hydrated | `h2hFunnelContext()` |
| `paypal_checkout_init_failure` | **Technical:** could not start checkout (API/network/session create) | `pay()` `.catch()` | `h2hFunnelContext({ reason: 'session_create_failed', message })` |
| `paypal_checkout_return_error` | **Return URL:** PayPal flow returned with an error signal (e.g. capture failed on `/api/paypal/return`) | `resumeCheckoutFromUrl()` when `paypal_error` query param is present and non-empty, and not `cancelled=1` | `h2hFunnelContext({ reason: 'paypal_return_error', paypal_error })` — `paypal_error` is a short slice of the query value (e.g. `1`) |
| `paypal_checkout_cancel` | **Buyer:** returned via PayPal cancel URL | `resumeCheckoutFromUrl()` when `cancelled=1` (see server `cancel_url`) | `h2hFunnelContext({ reason: 'buyer_cancelled' })` |
| `restore_submit` | Valid TXID; lookup started | `restore.html` `restore()` | `{ source_page: 'restore' }` |
| `restore_success` | Reading found | `restore.html` | `{ source_page: 'restore' }` |
| `restore_failure` | Empty / invalid / not found | `restore.html` | `{ source_page: 'restore', reason: 'empty_id' \| 'invalid_format' \| 'not_found' }` |

### PayPal semantics (important)

- **`paypal_checkout_init_failure`** — Session creation or checkout initialization failed before opening PayPal (not a user cancel).
- **`paypal_checkout_cancel`** — User hit PayPal’s cancel flow and was redirected to `/?reading=…&cancelled=1` (configured in `server.js` `cancel_url`).
- Returns with **`paypal_error`** on the query string emit **`paypal_checkout_return_error`** (see event table above).

---

## Files

- `analytics.js` — `h2hTrack`, `h2hFunnel`, `H2H_FUNNEL`, whitelist.
- `index.html` — `h2hFunnelContext()`, `resumeCheckoutFromUrl()` PayPal return signals (`cancelled`, `paypal_error`), funnel calls.
- `restore.html` — restore funnel with `source_page: 'restore'`.

## Optional (non-funnel) events

Still use `h2hTrack` directly (not whitelisted in `h2hFunnel`):

- `question_entered`, `moon_option_used`, `zodiac_option_used`, `reveal_click`, `restore_cta_click`
