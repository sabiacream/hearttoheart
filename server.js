const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, '.env'));

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://${HOST}:${PORT}`;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
const READING_PRICE_DOLLARS = Number(process.env.READING_PRICE_DOLLARS || 5);
const PAYPAL_MODE =
  String(PAYPAL_BASE_URL || '').includes('sandbox') || String(PAYPAL_BASE_URL || '').includes('sandbox.')
    ? 'sandbox'
    : 'live';

const DATA_DIR = path.join(ROOT_DIR, 'data');
const STORE_FILE = path.join(DATA_DIR, 'paypal-session-store.json');
const SPREAD_POSITIONS = {
  3: ['Past', 'Present', 'Future'],
  5: ['Present', 'Challenge', 'Root Cause', 'Near Future', 'Outcome'],
  7: ['Past', 'Present', 'Hidden Influence', 'Obstacle', 'Environment', 'Advice', 'Outcome']
};

let tokenCache = { accessToken: '', expiresAt: 0 };

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    paypalConfigured: Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET),
    webhookConfigured: Boolean(PAYPAL_WEBHOOK_ID)
  });
});

app.post('/api/create-checkout', async (req, res) => {
  const correlationId = `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  let sessionId = '';
  try {
    sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.', errorCode: 'invalid_session' });
    }
    if (!hasPayPalCreds()) {
      logCheckoutStructured({
        event: 'create_checkout_failed',
        correlationId,
        errorCode: 'paypal_not_configured',
        phase: 'precheck',
        sessionFingerprint: sessionFingerprint(sessionId),
        paypalMode: PAYPAL_MODE,
        message: 'PayPal client credentials are not set on the server.'
      });
      return res.status(500).json({
        error: 'Checkout is not available on this server right now.',
        errorCode: 'paypal_not_configured'
      });
    }

    const amount = sanitizeAmount(READING_PRICE_DOLLARS);
    let appBaseParsed;
    try {
      appBaseParsed = new URL(APP_BASE_URL);
    } catch (_e) {
      logCheckoutStructured({
        event: 'create_checkout_failed',
        correlationId,
        errorCode: 'app_url_invalid',
        phase: 'precheck',
        sessionFingerprint: sessionFingerprint(sessionId),
        paypalMode: PAYPAL_MODE,
        message: 'APP_BASE_URL is not a valid URL.'
      });
      return res.status(500).json({
        error: 'Checkout is not available on this server right now.',
        errorCode: 'app_url_invalid'
      });
    }

    const requestHost = getRequestPublicHost(req);
    const appBaseHost = appBaseParsed.hostname;
    const deploymentHints = describeDeploymentContext(requestHost, appBaseParsed);
    if (deploymentHints.appBaseHostMismatch) {
      logCheckoutStructured({
        event: 'create_checkout_config_warning',
        correlationId,
        sessionFingerprint: sessionFingerprint(sessionId),
        requestHost,
        appBaseHost,
        paypalMode: PAYPAL_MODE,
        message:
          'Request Host does not match APP_BASE_URL host; PayPal return_url may not match the site the user sees.'
      });
    }
    if (deploymentHints.likelyPreviewDeploy) {
      logCheckoutStructured({
        event: 'create_checkout_deployment_hint',
        correlationId,
        sessionFingerprint: sessionFingerprint(sessionId),
        appBaseHost,
        paypalMode: PAYPAL_MODE,
        message:
          'APP_BASE_URL looks like a preview-style host. PayPal may reject return_url unless that exact URL is allowed in the PayPal app settings.'
      });
    }
    if (deploymentHints.insecurePublicHttp) {
      logCheckoutStructured({
        event: 'create_checkout_deployment_hint',
        correlationId,
        sessionFingerprint: sessionFingerprint(sessionId),
        appBaseHost,
        paypalMode: PAYPAL_MODE,
        message: 'APP_BASE_URL uses http with a non-local host; live PayPal often requires https return URLs.'
      });
    }

    const returnUrl = new URL('/api/paypal/return', APP_BASE_URL);
    returnUrl.searchParams.set('sessionId', sessionId);

    const cancelUrl = new URL('/', APP_BASE_URL);
    cancelUrl.searchParams.set('reading', sessionId);
    cancelUrl.searchParams.set('cancelled', '1');

    const order = await paypalRequest('POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: sessionId,
          reference_id: sessionId,
          description: 'Heart 2 Heart 111 tarot reading',
          amount: { currency_code: 'USD', value: amount }
        }
      ],
      application_context: {
        brand_name: 'Heart 2 Heart 111',
        user_action: 'PAY_NOW',
        return_url: returnUrl.toString(),
        cancel_url: cancelUrl.toString()
      }
    });

    const checkoutUrl = (order.links || []).find((link) => link.rel === 'approve')?.href || '';
    if (!checkoutUrl) {
      logCheckoutStructured({
        event: 'create_checkout_failed',
        correlationId,
        errorCode: 'missing_approval_url',
        phase: 'parse_order',
        sessionFingerprint: sessionFingerprint(sessionId),
        requestHost,
        appBaseHost,
        paypalMode: PAYPAL_MODE,
        message: 'PayPal order response had no approve link.'
      });
      return res.status(500).json({
        error: 'Unable to create PayPal checkout right now.',
        errorCode: 'missing_approval_url'
      });
    }

    upsertSession(sessionId, {
      status: 'checkout-created',
      orderId: order.id || '',
      amountDollars: Number(amount),
      draft: req.body?.draft || null,
      preview: req.body?.preview || null,
      updatedAt: new Date().toISOString()
    });

    return res.json({ checkoutUrl, orderId: order.id || '' });
  } catch (error) {
    const meta = extractPayPalErrorMeta(error);
    const urlIssue = isLikelyReturnUrlRelatedIssue(meta.issue, meta.message);
    const errorCode = mapCheckoutFailureCode(error, meta);
    logCheckoutStructured({
      event: 'create_checkout_failed',
      correlationId,
      errorCode,
      phase: meta.phase || 'paypal_api',
      sessionFingerprint: sessionFingerprint(sessionId),
      requestHost: getRequestPublicHost(req),
      appBaseHost: safeAppBaseHost(),
      paypalMode: PAYPAL_MODE,
      paypalHttpStatus: meta.httpStatus,
      paypalPath: meta.path,
      paypalIssue: meta.issue,
      suspectedReturnUrlProblem: urlIssue,
      message: meta.message || error.message || 'unknown'
    });
    if (urlIssue) {
      logCheckoutStructured({
        event: 'create_checkout_deployment_hint',
        correlationId,
        sessionFingerprint: sessionFingerprint(sessionId),
        paypalMode: PAYPAL_MODE,
        message:
          'PayPal rejected the request in a way that often indicates return_url / cancel_url or APP_BASE_URL misconfiguration (preview host, http vs https, or dashboard URL list).'
      });
    }
    return res.status(500).json({
      error: 'Unable to create PayPal checkout right now.',
      errorCode
    });
  }
});

app.get('/api/payment-status', async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    let session = getSessionById(sessionId);
    if (!session) {
      return res.json({ status: 'pending', paidCredits: 0 });
    }

    if (session.status === 'paid' || session.status === 'revealed') {
      return res.json({
        status: 'paid',
        paidCredits: 1,
        transactionId: session.transactionId || '',
        txId: session.transactionId || ''
      });
    }

    if (session.orderId && hasPayPalCreds()) {
      try {
        const order = await paypalRequest('GET', `/v2/checkout/orders/${encodeURIComponent(session.orderId)}`);
        if (order.status === 'COMPLETED') {
          const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id || session.transactionId || '';
          session = markSessionPaid(sessionId, {
            orderId: session.orderId,
            transactionId: captureId,
            source: 'status-poll',
            paypalStatus: order.status
          });
        } else if (order.status === 'APPROVED') {
          upsertSession(sessionId, { status: 'approved', paypalStatus: order.status, updatedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.warn('[payment-status] order lookup failed:', err.message);
      }
    }

    if (session.status === 'paid' || session.status === 'revealed') {
      return res.json({
        status: 'paid',
        paidCredits: 1,
        transactionId: session.transactionId || '',
        txId: session.transactionId || ''
      });
    }

    return res.json({ status: 'pending', paidCredits: 0 });
  } catch (error) {
    console.error('[payment-status] error:', error.message);
    return res.status(500).json({ error: 'Unable to read payment status.' });
  }
});

app.get('/api/checkout-session', (req, res) => {
  const sessionId = String(req.query.sessionId || '').trim();
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }
  const session = getSessionById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  return res.json({
    sessionId,
    status: session.status || 'pending',
    draft: session.draft || null,
    preview: session.preview || null,
    transactionId: session.transactionId || session.txId || ''
  });
});

app.get('/api/restore-reading', (req, res) => {
  const txid = normalizeTxId(req.query.txid || req.query.transactionId);
  if (!txid) {
    return res.status(400).json({ error: 'txid is required.' });
  }

  const session = getSessionByTransactionId(txid);
  if (!session) {
    return res.status(404).json({ error: 'Reading not found.' });
  }

  const restored = buildRestoredReading(session, txid);
  if (!restored.cards.length) {
    return res.status(404).json({ error: 'Reading not found.' });
  }

  return res.json(restored);
});

app.get('/api/paypal/return', async (req, res) => {
  const orderId = String(req.query.token || '').trim();
  const providedSessionId = String(req.query.sessionId || '').trim();
  const sessionId = providedSessionId || (orderId ? getSessionIdByOrder(orderId) : '');

  if (!orderId || !sessionId) {
    return res.redirect(302, safeSiteUrl('/'));
  }

  try {
    let capture;
    try {
      capture = await paypalRequest('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
    } catch (captureErr) {
      const existingOrder = await paypalRequest('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      if (existingOrder.status !== 'COMPLETED') {
        throw captureErr;
      }
      capture = { purchase_units: existingOrder.purchase_units || [] };
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
    markSessionPaid(sessionId, {
      orderId,
      transactionId: captureId,
      source: 'return-url',
      paypalStatus: 'COMPLETED'
    });

    const redirectUrl = new URL('/', APP_BASE_URL);
    redirectUrl.searchParams.set('reading', sessionId);
    if (captureId) {
      redirectUrl.searchParams.set('tx', captureId);
    }
    return res.redirect(302, redirectUrl.toString());
  } catch (error) {
    console.error('[paypal-return] error:', error.message);
    upsertSession(sessionId, {
      status: 'capture-failed',
      lastError: error.message,
      updatedAt: new Date().toISOString()
    });
    const fallbackUrl = new URL('/', APP_BASE_URL);
    fallbackUrl.searchParams.set('reading', sessionId);
    fallbackUrl.searchParams.set('paypal_error', '1');
    return res.redirect(302, fallbackUrl.toString());
  }
});

app.post('/api/paypal/webhook', async (req, res) => {
  try {
    const event = req.body || {};
    if (!event.event_type) {
      return res.status(400).json({ error: 'Invalid webhook payload.' });
    }

    if (PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature(req.headers, event);
      if (!isValid) {
        return res.status(400).json({ error: 'Webhook verification failed.' });
      }
    }

    handleWebhookEvent(event);
    return res.json({ ok: true });
  } catch (error) {
    console.error('[webhook] error:', error.message);
    return res.status(500).json({ error: 'Webhook handling failed.' });
  }
});

app.use(express.static(ROOT_DIR, { extensions: ['html'] }));

app.listen(PORT, HOST, () => {
  console.log(`Heart2Heart server running at ${APP_BASE_URL}`);
  console.log(`PayPal API mode: ${PAYPAL_MODE}`);
  if (!hasPayPalCreds()) {
    console.log('PayPal credentials missing. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env');
  }
  if (!PAYPAL_WEBHOOK_ID) {
    console.log('PAYPAL_WEBHOOK_ID is not set yet. Webhooks are optional for first test, but recommended.');
  }
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function hasPayPalCreds() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

function logCheckoutStructured(payload) {
  try {
    console.error(JSON.stringify(payload));
  } catch (_err) {
    console.error('[checkout-log] serialization_failed');
  }
}

function sessionFingerprint(sessionId) {
  const s = String(sessionId || '').trim();
  if (!s) return '';
  if (s.length <= 10) return `${s.length}ch`;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function getRequestPublicHost(req) {
  const xf = req.headers['x-forwarded-host'];
  const raw = (Array.isArray(xf) ? xf[0] : xf) || req.headers.host || '';
  return String(raw).split(',')[0].trim().toLowerCase();
}

function safeAppBaseHost() {
  try {
    return new URL(APP_BASE_URL).hostname;
  } catch (_e) {
    return '';
  }
}

function isLocalOrLoopbackHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost') return true;
  if (h.endsWith('.localhost')) return true;
  if (h === '127.0.0.1' || h === '[::1]' || h === '::1') return true;
  if (/^127\.\d+\.\d+\.\d+$/.test(h)) return true;
  return false;
}

function likelyPreviewDeploymentHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h) return false;
  if (h.includes('--') && h.endsWith('.netlify.app')) return true;
  if (h.endsWith('.pages.dev')) return true;
  if (h.includes('-git-') && h.endsWith('.vercel.app')) return true;
  if (h.includes('deploy-preview') && h.endsWith('.netlify.app')) return true;
  return false;
}

function describeDeploymentContext(requestHost, appBaseUrl) {
  const appHost = appBaseUrl.hostname;
  const appBaseHostMismatch =
    Boolean(requestHost && appHost && requestHost !== appHost) &&
    !isLocalOrLoopbackHost(appHost) &&
    !isLocalOrLoopbackHost(requestHost);
  const likelyPreviewDeploy = likelyPreviewDeploymentHost(appHost);
  const insecurePublicHttp =
    appBaseUrl.protocol === 'http:' && !isLocalOrLoopbackHost(appHost);
  return { appBaseHostMismatch, likelyPreviewDeploy, insecurePublicHttp };
}

function extractPayPalErrorMeta(error) {
  const e = error || {};
  return {
    phase: e.paypalPhase || 'paypal_api',
    httpStatus: typeof e.paypalHttpStatus === 'number' ? e.paypalHttpStatus : undefined,
    path: e.paypalPath || '',
    issue: e.paypalIssue || '',
    message: String(e.message || '').slice(0, 300)
  };
}

function isLikelyReturnUrlRelatedIssue(issue, message) {
  const blob = `${String(issue || '')} ${String(message || '')}`.toUpperCase();
  return (
    blob.includes('RETURN_URL') ||
    blob.includes('CANCEL_URL') ||
    blob.includes('REDIRECT') ||
    blob.includes('APPLICATION_CONTEXT') ||
    blob.includes('INVALID_URL') ||
    (blob.includes('MALFORMED') && blob.includes('URL'))
  );
}

function mapCheckoutFailureCode(error, meta) {
  if (error && error.message && String(error.message).includes('PayPal auth failed')) {
    return 'paypal_auth_failed';
  }
  if (meta.httpStatus === 401 || meta.httpStatus === 403) {
    return 'paypal_auth_failed';
  }
  if (meta.issue && String(meta.issue).toUpperCase().includes('VALIDATION')) {
    return 'paypal_validation_failed';
  }
  return 'paypal_order_failed';
}

function sanitizeAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '5.00';
  return numeric.toFixed(2);
}

function safeSiteUrl(pathname) {
  const next = new URL(pathname, APP_BASE_URL);
  return next.toString();
}

async function getAccessToken() {
  if (!hasPayPalCreds()) {
    throw new Error('PayPal credentials are not configured.');
  }
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const basic = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const text = await response.text();
  const data = parseJson(text);
  if (!response.ok || !data.access_token) {
    const message = data.error_description || data.error || text || 'Unknown PayPal auth error';
    const err = new Error(`PayPal auth failed (${response.status}): ${message}`);
    err.paypalPhase = 'oauth';
    err.paypalHttpStatus = response.status;
    err.paypalPath = '/v1/oauth2/token';
    err.paypalIssue = String(data.error || '').trim() || 'oauth_error';
    throw err;
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 300) * 1000
  };
  return tokenCache.accessToken;
}

async function paypalRequest(method, apiPath, body) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  const data = parseJson(text);
  if (!response.ok) {
    const issue = data.details?.[0]?.issue || data.message || text || 'Unknown PayPal API error';
    const err = new Error(`PayPal ${method} ${apiPath} failed (${response.status}): ${issue}`);
    err.paypalPhase = 'api';
    err.paypalHttpStatus = response.status;
    err.paypalPath = apiPath;
    err.paypalIssue = String(issue).slice(0, 200);
    throw err;
  }
  return data;
}

async function verifyWebhookSignature(headers, event) {
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  const transmissionSig = headers['paypal-transmission-sig'];

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const payload = {
    transmission_id: transmissionId,
    transmission_time: transmissionTime,
    cert_url: certUrl,
    auth_algo: authAlgo,
    transmission_sig: transmissionSig,
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: event
  };

  const verify = await paypalRequest('POST', '/v1/notifications/verify-webhook-signature', payload);
  return verify.verification_status === 'SUCCESS';
}

function handleWebhookEvent(event) {
  const type = event.event_type;
  const resource = event.resource || {};

  if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId = resource.supplementary_data?.related_ids?.order_id || '';
    const captureId = resource.id || '';
    const sessionId = resource.custom_id || (orderId ? getSessionIdByOrder(orderId) : '');
    if (sessionId) {
      markSessionPaid(sessionId, {
        orderId,
        transactionId: captureId,
        source: 'webhook',
        paypalStatus: 'COMPLETED'
      });
    }
    return;
  }

  if (type === 'CHECKOUT.ORDER.APPROVED') {
    const orderId = resource.id || '';
    const sessionId = resource.purchase_units?.[0]?.custom_id || (orderId ? getSessionIdByOrder(orderId) : '');
    if (sessionId) {
      upsertSession(sessionId, {
        orderId,
        status: 'approved',
        paypalStatus: 'APPROVED',
        updatedAt: new Date().toISOString()
      });
    }
    return;
  }

  if (type === 'PAYMENT.CAPTURE.DENIED') {
    const orderId = resource.supplementary_data?.related_ids?.order_id || '';
    const sessionId = resource.custom_id || (orderId ? getSessionIdByOrder(orderId) : '');
    if (sessionId) {
      upsertSession(sessionId, {
        orderId,
        status: 'payment-denied',
        paypalStatus: 'DENIED',
        updatedAt: new Date().toISOString()
      });
    }
  }
}

function emptyStore() {
  return { sessionsById: {}, orderToSession: {} };
}

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(emptyStore(), null, 2), 'utf8');
  }
}

function parseJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    return {};
  }
}

function readStore() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = parseJson(raw);
    if (!parsed.sessionsById || !parsed.orderToSession) return emptyStore();
    return parsed;
  } catch (_err) {
    return emptyStore();
  }
}

function writeStore(store) {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function upsertSession(sessionId, updates) {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.sessionsById[sessionId] || {
    sessionId,
    createdAt: now,
    status: 'pending'
  };
  const next = {
    ...existing,
    ...updates,
    sessionId,
    updatedAt: updates.updatedAt || now
  };
  store.sessionsById[sessionId] = next;
  if (next.orderId) {
    store.orderToSession[next.orderId] = sessionId;
  }
  writeStore(store);
  return next;
}

function getSessionById(sessionId) {
  const store = readStore();
  return store.sessionsById[sessionId] || null;
}

function getSessionIdByOrder(orderId) {
  if (!orderId) return '';
  const store = readStore();
  return store.orderToSession[orderId] || '';
}

function markSessionPaid(sessionId, details) {
  const txId = details.transactionId || details.txId || '';
  return upsertSession(sessionId, {
    status: 'paid',
    paypalStatus: details.paypalStatus || 'COMPLETED',
    orderId: details.orderId || '',
    transactionId: txId,
    txId,
    source: details.source || 'unknown',
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function normalizeTxId(value) {
  return String(value || '').trim().toUpperCase();
}

function cleanStringOrNull(value) {
  const cleaned = String(value || '').trim();
  return cleaned || null;
}

function getSessionByTransactionId(txid) {
  const wanted = normalizeTxId(txid);
  if (!wanted) return null;

  const store = readStore();
  const sessions = Object.values(store.sessionsById || {});
  for (const session of sessions) {
    const known = normalizeTxId(session.transactionId || session.txId);
    if (known && known === wanted) return session;
  }
  return null;
}

function buildRestoredReading(session, txid) {
  const draft = session.draft || {};
  const preview = session.preview || {};
  const spread = Number(draft.spread || preview.spN || 0);
  const positions = SPREAD_POSITIONS[spread] || [];
  const drawn = Array.isArray(preview.drawn) ? preview.drawn : [];
  const cards = drawn
    .map((card, index) => ({
      name: cleanStringOrNull(card.n),
      symbol: cleanStringOrNull(card.s || card.u) || '',
      position: positions[index] || `Card ${index + 1}`
    }))
    .filter((card) => card.name);

  return {
    txid: normalizeTxId(txid),
    created_at: session.paidAt || session.updatedAt || session.createdAt || new Date().toISOString(),
    question: cleanStringOrNull(draft.question),
    category: cleanStringOrNull(draft.category || preview.cat),
    trinket: cleanStringOrNull(draft.trinket || preview.chosenT),
    spread: spread || null,
    cards
  };
}
