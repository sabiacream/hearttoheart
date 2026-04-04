# Heart to Heart 111 — Complete Setup Guide
## PayPal + Supabase Cloud Storage for Readings

---

## WHAT YOU'RE BUILDING

When a customer pays $5 and enters their PayPal Transaction ID:
1. Their reading is saved to **Supabase** (cloud database)
2. They can restore it on **any device, any browser, forever**
3. You can see all readings + transaction IDs in your Supabase dashboard
4. Nobody loses their reading, nobody feels screwed

---

## STEP 1: Set Up the Supabase Table (~5 min)

You already have a Supabase account. Create this in an existing project or a new one.

### 1a. Go to your Supabase dashboard → SQL Editor

Run this SQL to create the readings table:

```sql
CREATE TABLE readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  txid text NOT NULL UNIQUE,
  question text,
  category text,
  trinket text,
  spread integer,
  cards jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by transaction ID
CREATE INDEX idx_readings_txid ON readings(txid);
```

### 1b. Set up Row Level Security (RLS)

Because this app runs in the browser, your Supabase **anon key is public by design**.  
Security comes from RLS + a controlled lookup function (not direct table SELECT). Run this SQL:

```sql
-- Enable RLS
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Clean up old policies if you re-run this
DROP POLICY IF EXISTS "Anyone can insert readings" ON readings;
DROP POLICY IF EXISTS "Anyone can select readings by txid" ON readings;

-- Anyone can insert a reading (after they pay)
CREATE POLICY "Anyone can insert readings"
  ON readings FOR INSERT
  WITH CHECK (true);

-- Do NOT allow direct table SELECT from anon users
REVOKE SELECT ON TABLE readings FROM anon;

-- Create a controlled lookup function
CREATE OR REPLACE FUNCTION public.get_reading_by_txid(p_txid text)
RETURNS TABLE (
  txid text,
  question text,
  category text,
  trinket text,
  spread integer,
  cards jsonb,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.txid, r.question, r.category, r.trinket, r.spread, r.cards, r.created_at
  FROM public.readings r
  WHERE r.txid = p_txid
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_reading_by_txid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reading_by_txid(text) TO anon;
```

This blocks “read all rows” attacks from the browser while still allowing restore by Transaction ID.

### 1c. Get your Supabase credentials

Go to **Project Settings → API** and copy:
- **Project URL** — looks like `https://xxxxx.supabase.co`
- **anon/public key** — the long string starting with `eyJ...`

You'll paste these into your site code in Step 3.

---

## STEP 2: Set Up PayPal (~2 min)

### Imported PayPal Sandbox Info (from other Heart2Heart thread)

If you want to use the same sandbox app/config that was already set up in your other Heart2Heart project, use:

```env
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_CLIENT_ID=AfM5OxGK6m2uRwDOQCJ0jP5XOexpCgvp__PulkaOR89OsD-D1S58qqgO2R1Sys3YkVmpwOyF4uj3m7II
PAYPAL_CLIENT_SECRET=EPX3uZy9RHEllEb9AYJehvYS4yfASzFv43YdXYo9ZUSGBJZ12GRO31mf0a4BbopyePoih_LWK4opdK9q
READING_PRICE_DOLLARS=5
```

These values are also saved in this project at `.env` and `.env.example`.
For production, rotate/regenerate the secret and do not commit `.env`.

### Option A: PayPal.me Link (Recommended — simplest)

1. Go to https://www.paypal.com/paypalme/
2. Create or find your PayPal.me link
3. Your payment URL will be: `https://www.paypal.me/YourUsername/5`

### Option B: PayPal Buy Now Button

1. Log in to PayPal → Pay & Get Paid → PayPal Buttons
2. Create a "Buy Now" button for $5
3. Copy the hosted button URL

Either way, you'll replace `YOUR_PAYPAL_LINK` in the code below.

---

## STEP 3: Update index.html

You need to make 3 changes to your index.html file.

### Change 1: Add the Supabase script tag

Find the closing `</head>` tag and add this **right before it**:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

### Change 2: Add Supabase config + updated functions

Find this line at the top of your `<script>` block:

```javascript
// floating hearts
```

Add this **right before** that line:

```javascript
// ── Supabase ──
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← Replace
const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE';                     // ← Replace
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveReading(txid, data) {
  const { error } = await sb.from('readings').insert({
    txid: txid,
    question: data.question || null,
    category: data.category || null,
    trinket: data.trinket || null,
    spread: data.spread,
    cards: data.cards
  });
  if (error) console.error('Save failed:', error);
  return !error;
}

async function loadReading(txid) {
  const { data, error } = await sb.rpc('get_reading_by_txid', { p_txid: txid });
  if (error) return null;
  return Array.isArray(data) ? (data[0] || null) : data;
}
```

### Change 3: Replace the pay, verify, and unlock functions

Find and **replace** these 3 functions in your code:

**Find:**
```javascript
function pay(){
  window.open('https://www.paypal.com/paypalme/YourPayPalHere/5','_blank');
  ...
}
function vfy(){if(confirm('Have you completed your $5 PayPal payment?'))unlock();}
function unlock(){
  ...
}
```

**Replace with:**

```javascript
function pay(){
  window.open('https://www.paypal.me/YOUR_PAYPAL_LINK/5','_blank');
  const b=document.getElementById('ppb');b.textContent='Complete payment in PayPal →';b.style.background='var(--pk-hot)';
  document.getElementById('txid-box').style.display='block';
}

function vfy(){
  const txid=document.getElementById('txid-input').value.trim();
  if(!txid){alert('Please enter your PayPal Transaction ID');return;}
  document.getElementById('vfy-btn').textContent='Unlocking...';
  document.getElementById('vfy-btn').disabled=true;
  unlock(txid);
}

async function unlock(txid){
  document.getElementById('prev').classList.remove('on');
  const w=document.getElementById('rc'),f=document.getElementById('frd'),p=POS[spN];
  const q=document.getElementById('qinput').value.trim();

  const readingData={
    question:q, category:cat, trinket:chosenT, spread:spN,
    cards:drawn.map((c,i)=>({name:c.n,symbol:c.s,numeral:c.u,position:p[i]}))
  };

  // Save to Supabase
  const saved=await saveReading(txid,readingData);

  // Also save locally as backup
  try{localStorage.setItem('h2h_'+txid,JSON.stringify(readingData))}catch(e){}

  // Render
  renderFullReading(readingData,w);
  f.classList.add('on');
  f.scrollIntoView({behavior:'smooth',block:'start'});

  // Show txid for their records
  const note=document.createElement('p');
  note.style.cssText='text-align:center;font-size:.72rem;color:var(--ts);margin-top:.8rem';
  note.innerHTML='Your Transaction ID: <strong style="color:var(--pink)">'+txid+'</strong><br>Save this to restore your reading on any device, anytime.';
  const existingNote=f.querySelector('.txid-note');
  if(existingNote)existingNote.remove();
  note.className='txid-note';
  f.querySelector('.racts').after(note);
}

function renderFullReading(data,container){
  let h='<h3>💗 Your Reading</h3>';
  if(data.question)h+='<p style="text-align:center;font-style:italic;color:var(--ts);font-size:.82rem;margin-bottom:1.2rem">"'+data.question+'"</p>';
  data.cards.forEach(c=>{
    h+='<div class="ci"><div class="cih"><span class="cis">'+c.symbol+'</span><div><div class="cin">'+c.name+'</div><div class="cip">'+c.position+'</div></div></div><p class="cit">'+(INTERP[c.name]||'This card carries a unique message. Trust what resonates.')+'</p></div>';
  });
  const tc=data.trinket?' The '+data.trinket+' you chose amplifies this energy.':'';
  const cc=data.category?(CAT_CLOSE[data.category]||''):'Take what resonates, release the rest.';
  h+='<div class="clos"><h4>Closing Guidance</h4><p>'+cc+tc+' The power has always been within you. You are held. 💗</p></div>';
  container.innerHTML=h;
}
```

### Change 4: Add the Transaction ID input to the preview box

In your HTML, find:
```html
<div class="vlk" onclick="vfy()">already paid? tap here</div>
```

Replace that entire line with:
```html
<div id="txid-box" style="display:none;margin-top:1rem">
  <p style="font-size:.72rem;color:var(--tm);margin-bottom:.4rem">Enter your PayPal Transaction ID:</p>
  <input type="text" id="txid-input" placeholder="e.g. 5TY12345AB678901C"
    style="width:100%;max-width:300px;padding:.5rem .7rem;border:1.5px solid #eee;border-radius:8px;font-family:var(--f);font-size:.82rem;text-align:center;margin:0 auto;display:block"
    onfocus="this.style.borderColor='var(--pink)'" onblur="this.style.borderColor='#eee'">
  <button id="vfy-btn" onclick="vfy()"
    style="margin-top:.7rem;background:var(--pink);color:#fff;border:none;padding:.55rem 1.4rem;border-radius:100px;font-family:var(--f);font-size:.78rem;font-weight:600;cursor:pointer">
    Unlock My Reading
  </button>
  <p style="font-size:.58rem;color:var(--tmu);margin-top:.4rem">Find this in your PayPal receipt email or PayPal Activity</p>
</div>
```

---

## STEP 4: Create restore.html

Create a file called `restore.html` in the same folder as index.html. Use the restore.html file I've provided — it connects to the same Supabase table.

**Important:** Open restore.html and replace these two lines near the top of the script:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE';
```
With your actual Supabase project URL and anon key (same values as index.html).

---

## STEP 5: Test It

1. Open your site and do a full reading
2. At the paywall, click the PayPal button (cancel/close the PayPal page)
3. Enter any test ID like `TEST123` in the Transaction ID field
4. Click "Unlock My Reading" — the reading should appear
5. Go to your **Supabase dashboard → Table Editor → readings** — you should see the row
6. Open restore.html, enter `TEST123` — the reading should load from Supabase
7. Open restore.html in a **different browser** or **incognito** — enter `TEST123` — it should still work!
8. Delete the test row from Supabase when you're done

---

## HOW CUSTOMERS FIND THEIR TRANSACTION ID

**PayPal receipt email:**
- PayPal sends a confirmation email for every payment
- The Transaction ID is listed in the email (looks like: 5TY12345AB678901C)

**PayPal website:**
1. Log in to paypal.com → click "Activity"
2. Find the $5 payment → click it
3. Transaction ID is in the details

**PayPal mobile app:**
1. Open app → tap "Activity"
2. Tap the payment → Transaction ID is in the details

---

## IF SOMETHING GOES WRONG

**Customer says "I paid but can't unlock":**
1. Ask for their Transaction ID
2. Check your PayPal Activity to confirm the $5 payment
3. Go to Supabase → readings table → search for their txid
4. If the reading isn't there, they may have closed the page before entering the ID. You can manually look up the payment in PayPal and walk them through restore.html

**Customer says "I lost my Transaction ID":**
1. Tell them to check their email for the PayPal receipt
2. Or log in to PayPal → Activity → find the payment
3. If all else fails, you can look up their payment in your PayPal Activity by date/name and give them the ID

**Customer cleared their browser:**
- No problem! Readings are stored in Supabase. They just need their Transaction ID and restore.html works from any device.

---

## YOUR SUPABASE DASHBOARD IS YOUR ADMIN PANEL

Go to **Supabase → Table Editor → readings** anytime to:
- See all readings that have been purchased
- Look up a reading by Transaction ID
- Verify payments match your PayPal records
- Delete test data

---

## ANALYTICS (FUNNEL EVENTS)

The site loads `analytics.js`, which defines `window.h2hTrack(eventName, props?)`. If no provider is installed, calls are no-ops. To debug: `localStorage.setItem('h2h_debug_analytics','1')` then open the console.

**Wire a provider:** add GA4 (`gtag`), Plausible (`plausible`), or GTM (`dataLayer`) — see comments at the top of `analytics.js`.

| Event | Where it fires |
|-------|----------------|
| `password_gate_view` | `index.html` — password gate visible on load (session not already unlocked) |
| `password_submit` | `index.html` — `checkPw()` started (button or Enter) |
| `password_success` | `index.html` — correct hash, gate dismissed |
| `password_failure` | `index.html` — wrong password |
| `hero_cta_click` | `index.html` — hero “Begin the reading” (`entry: hero_primary`) or mobile sticky (`entry: mobile_sticky`) |
| `restore_cta_click` | `index.html` — any link to `restore.html` (`placement`: hero, nav, footer, paywall, other) |
| `category_selected` | `index.html` — `chooseCategory()` when category changes (`category`) |
| `question_entered` | `index.html` — question field blur with text, or 4+ chars typed (`length`) |
| `charm_selected` | `index.html` — `pickT()` when charm changes (`charm`) |
| `spread_selected` | `index.html` — `setSp()` when card count changes (`card_count`) |
| `moon_option_used` | `index.html` — first time moon `<select>` set to a non-empty value (once per page load) |
| `zodiac_option_used` | `index.html` — first time zodiac `<select>` set to a non-empty value (once per page load) |
| `reveal_click` | `index.html` — start of `doReveal()` (`spread_cards`) |
| `preview_ready` | `index.html` — `showPrev()` when paywall preview is shown (`spread_cards`, `cards_drawn`) |
| `unlock_click` | `index.html` — start of `pay()` (intent before API call) |
| `paypal_checkout_start` | `index.html` — checkout session created, URL ready (before `window.open` / redirect) |
| `paypal_checkout_success` | `index.html` — `checkPaymentStatus()` paid path or `resumeCheckoutFromUrl()` success |
| `paypal_checkout_cancel` | `index.html` — `pay()` rejected / checkout session failed (`reason: checkout_start_failed`, `message`) |
| `restore_submit` | `restore.html` — valid ID, lookup starting |
| `restore_success` | `restore.html` — reading found and rendered |
| `restore_failure` | `restore.html` — empty ID, invalid format, or not found (`reason`: `empty_id`, `invalid_format`, `not_found`) |

---

## FILE CHECKLIST

Your GitHub repo should have:
- [ ] `analytics.js` — funnel event bridge (`h2hTrack`)
- [ ] `index.html` — main site (with Supabase + PayPal changes)
- [ ] `restore.html` — reading restore page
- [ ] `terms.html` — terms, privacy, disclaimer
