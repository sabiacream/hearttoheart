# PayPal Test Setup (Sandbox)

## 1) Install and start

```bash
npm install
npm start
```

Site and API run at:

- `http://localhost:8787`
- Health check: `http://localhost:8787/api/health`

## 2) Create webhook URL (for testing)

PayPal needs a public HTTPS URL, so tunnel localhost:

```bash
ngrok http 8787
```

If ngrok gives you:

- `https://abc123.ngrok-free.app`

Then your webhook URL is:

- `https://abc123.ngrok-free.app/api/paypal/webhook`

## 3) Add webhook in PayPal Developer Dashboard

1. Go to your Sandbox app in PayPal Developer Dashboard.
2. Add webhook URL from step 2.
3. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
4. Save and copy the generated Webhook ID.

## 4) Put webhook ID in `.env`

Set:

```env
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID_FROM_PAYPAL
```

Then restart:

```bash
npm start
```

## 5) Run a full sandbox payment test

1. Open `http://localhost:8787`.
2. Generate a reading and click unlock.
3. Pay with a PayPal Sandbox buyer account.
4. Return to the site and confirm the reading unlocks.
