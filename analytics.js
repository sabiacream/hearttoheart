/**
 * Heart to Heart 111 — funnel analytics bridge
 *
 * Forwards events to whichever stack is present (safe no-ops if none).
 * Enable debug: localStorage.setItem('h2h_debug_analytics','1')
 *
 * Wire your provider:
 * - GA4: load gtag.js; events pass through as gtag('event', name, params)
 * - GTM: use dataLayer pushes with event name + flat params
 * - Plausible: load plausible.js; uses plausible(eventName, { props })
 *
 * Event map (see SETUP_GUIDE or repo docs): password_gate_view → … → paypal_checkout_success
 */
(function (global) {
  'use strict';

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

  global.h2hTrack = h2hTrack;
})(typeof window !== 'undefined' ? window : this);
