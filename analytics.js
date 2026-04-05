/**
 * Heart to Heart 111 — funnel analytics bridge
 *
 * h2hFunnel(eventName, props) — preferred for funnel steps (whitelisted; no-op if unknown).
 * h2hTrack(eventName, props) — low-level; forwards to gtag / Plausible / dataLayer (safe no-ops if none).
 *
 * Enable debug: localStorage.setItem('h2h_debug_analytics','1')
 *
 * Provider wiring:
 * - GA4: load gtag.js; events pass as gtag('event', name, { event_category: 'tarot_funnel', ...params })
 * - GTM: ensure dataLayer exists; receives { event, h2h_event, ...params }
 * - Plausible: load plausible.js; plausible(eventName, { props })
 *
 * Event names, props, and PayPal semantics: see ANALYTICS-FUNNEL.md
 */
(function (global) {
  'use strict';

  /** Canonical funnel event names (single source of truth). */
  var FUNNEL = Object.freeze({
    password_gate_view: 'password_gate_view',
    password_success: 'password_success',
    password_failure: 'password_failure',
    hero_cta_click: 'hero_cta_click',
    category_selected: 'category_selected',
    charm_selected: 'charm_selected',
    spread_selected: 'spread_selected',
    preview_ready: 'preview_ready',
    preview_first_click: 'preview_first_click',
    unlock_full_reading_click: 'unlock_full_reading_click',
    paypal_checkout_start: 'paypal_checkout_start',
    paypal_checkout_success: 'paypal_checkout_success',
    paypal_checkout_init_failure: 'paypal_checkout_init_failure',
    paypal_checkout_return_error: 'paypal_checkout_return_error',
    paypal_checkout_cancel: 'paypal_checkout_cancel',
    restore_submit: 'restore_submit',
    restore_success: 'restore_success',
    restore_failure: 'restore_failure'
  });

  var FUNNEL_LOOKUP = Object.create(null);
  for (var fk in FUNNEL) {
    if (Object.prototype.hasOwnProperty.call(FUNNEL, fk)) FUNNEL_LOOKUP[FUNNEL[fk]] = true;
  }

  function isDebug() {
    try {
      return global.localStorage && global.localStorage.getItem('h2h_debug_analytics') === '1';
    } catch (e) {
      return false;
    }
  }

  function sanitizeProps(props) {
    if (!props || typeof props !== 'object') return {};
    var out = {};
    for (var k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
      var v = props[k];
      if (v === undefined || typeof v === 'function') continue;
      if (typeof v === 'string' && v.length > 120) out[k] = v.slice(0, 120);
      else if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') out[k] = v;
    }
    return out;
  }

  function h2hTrack(eventName, props) {
    if (!eventName || typeof eventName !== 'string') return;
    var p = sanitizeProps(props);
    try {
      if (isDebug() && global.console && global.console.debug) {
        global.console.debug('[h2hTrack]', eventName, p);
      }

      if (typeof global.gtag === 'function') {
        var gaPayload = Object.assign({ event_category: 'tarot_funnel' }, p);
        global.gtag('event', eventName, gaPayload);
      }

      if (typeof global.plausible === 'function') {
        try {
          global.plausible(eventName, { props: p });
        } catch (e1) {
          global.plausible(eventName);
        }
      }

      if (Array.isArray(global.dataLayer)) {
        var dl = Object.assign({ event: eventName, h2h_event: eventName }, p);
        global.dataLayer.push(dl);
      }
    } catch (e) {
      /* never throw into app code */
    }
  }

  /**
   * Funnel-only helper: only fires h2hTrack for whitelisted event names.
   * @param {string} eventName - one of FUNNEL values, e.g. 'hero_cta_click'
   * @param {object} [props]
   */
  function h2hFunnel(eventName, props) {
    if (typeof h2hTrack !== 'function') return;
    if (!eventName || typeof eventName !== 'string' || !FUNNEL_LOOKUP[eventName]) {
      if (isDebug() && global.console && global.console.warn) {
        global.console.warn('[h2hFunnel] unknown or missing event:', eventName);
      }
      return;
    }
    h2hTrack(eventName, props);
  }

  global.h2hTrack = h2hTrack;
  global.h2hFunnel = h2hFunnel;
  global.H2H_FUNNEL = FUNNEL;
})(typeof window !== 'undefined' ? window : this);
