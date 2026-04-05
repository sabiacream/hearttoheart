# Changelog

## Unreleased

### PayPal checkout diagnostics & paywall UX

- **Server (`server.js`):** Structured JSON logs for `/api/create-checkout` failures (correlation id, safe session fingerprint, PayPal HTTP status/path/issue, mode sandbox vs live, optional hints when `APP_BASE_URL` host looks like a preview deploy, mismatches `Host` vs `APP_BASE_URL`, or return/cancel URL problems). Responses include a stable `errorCode` alongside the user-facing `error` string. PayPal OAuth/API errors attach machine-readable metadata for logging.
- **Client (`index.html`):** Checkout creation reads response bodies via text + JSON parse to detect non-JSON (e.g. 404 HTML from static hosting). Failures map `errorCode` to copy-safe messages, show an inline error in the paywall (`#pay-err`) with `role="alert"` and `aria-describedby` on the unlock button, and use `announce(..., 'assertive')` instead of `alert()`. Analytics `paypal_checkout_init_failure` now includes `error_code` and `http_status` when present.
