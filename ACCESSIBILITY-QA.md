# Accessibility QA — Heart to Heart 111

Short checks to run after meaningful HTML/CSS/JS changes. Use **keyboard only**, **VoiceOver** (Mac) or **NVDA** (Windows), and a **phone** for tap targets. No accessibility expertise required—follow the steps and note anything that feels broken or confusing.

**Pages:** `index.html` (reading app), `restore.html`, `contact.html`, `faq.html`

---

## Keyboard-only checklist

- [ ] Every interactive control (links, buttons, fields, accordions) can be reached with **Tab** (and **Shift+Tab** backward).
- [ ] Nothing important works **only** on hover—there is always a keyboard path.
- [ ] **Enter** / **Space** activate buttons and submit actions as expected.
- [ ] **Space** toggles FAQ accordions (`faq.html` `<details>` / `<summary>`).
- [ ] After actions that open new content (e.g. full reading, preview panel), you can still Tab to the new content without getting stuck.

---

## Focus order checklist

- [ ] **First Tab stop** on each page: “Skip to main content” goes to `#main-content` (`restore.html`, `contact.html`, `faq.html`; same pattern on `index.html`).
- [ ] **Password gate** (`index.html`, when shown): focus stays in the gate (phrase field, submit, contact link); the page behind is not reachable with Tab until the gate is dismissed.
- [ ] **After password success:** focus lands in main content (not “lost” on the body).
- [ ] **Hero CTA** (“Begin the reading”): activation moves you into the reading flow in a sensible order (question → categories → spread, etc.).
- [ ] **Reading flow:** step controls and card interactions receive focus in an order that matches the visual layout.
- [ ] **Reveal (flip cards):** focusable cards can be operated with keyboard; when the preview appears, focus moves to the preview heading (or another clear landmark).
- [ ] **Preview / paywall:** focus can reach summary text, sample/unlock controls, PayPal button, and verify control without skipping sections.
- [ ] **Restore** (`restore.html`): after a successful restore, focus moves to the restored reading heading; after errors, focus returns to the transaction ID field.
- [ ] **Contact** (`contact.html`): focus order follows page top → nav → main sections → footer.
- [ ] **FAQ** (`faq.html`): focus order follows nav → page title → each accordion in order.

---

## Reduced-motion checklist

Use OS setting **Reduce motion** (macOS / iOS / Windows) and retest quickly.

- [ ] **index.html:** scrolling does not insist on smooth motion where it would block or disorient (smooth scroll should fall back appropriately).
- [ ] **Preview panel / unlock / redo:** large scroll animations are reduced or instant per `prefers-reduced-motion`.
- [ ] **restore.html:** scroll-to-result respects reduced motion.
- [ ] **faq.html / contact.html:** accordion chevrons and card hovers do not rely on motion-only feedback.

---

## Screen reader smoke test (5–10 minutes)

Pick **VoiceOver** (Mac: Cmd+F5) or **NVDA** (Windows). Navigate by headings and landmarks.

- [ ] **Landmarks:** one clear **main** region; **nav** labeled consistently (e.g. “Site”).
- [ ] **Headings:** one main **h1** per page; FAQ questions use headings inside summaries; restore page has **h1** then **h2** before the form group.
- [ ] **Password gate:** announced as a dialog with name and description; errors on wrong phrase are announced.
- [ ] **Live regions:** status messages (e.g. flow hints, unlock messages) are read when they change without stealing focus inappropriately.
- [ ] **Card spread / reveal:** each card has a sensible name when focused (role/label).
- [ ] **Preview / paywall:** region or structure makes the paywall and summary distinguishable from the rest of the page.
- [ ] **Restore form:** field label, help text, and inline/alert errors associate with the input (`aria-describedby` / `aria-invalid` / `role="alert"` where used).
- [ ] **Contact:** section headings and links read clearly; decorative icons are not read as noisy words (e.g. `aria-hidden` on emoji decorations).
- [ ] **FAQ:** opening a question reads the answer content; heading level order feels logical.

---

## Mobile tap target checklist

On a **narrow viewport** (~375px width), with a finger (or mobile emulator):

- [ ] **Top nav links** (`index.html` and inner pages): easy to tap without hitting neighbors (~44×44px minimum effective target—padding counts).
- [ ] **Hero CTA** and primary **reading flow** buttons: comfortable to tap.
- [ ] **Preview / paywall:** “Unlock full reading — $5” / PayPal-related controls and verify: tappable, not edge-to-edge cramped.
- [ ] **Charm / chest / spread** (if changed): primary taps are not tiny single-pixel hit areas.
- [ ] **restore.html:** “Restore My Reading”, “Copy Reading”, “New Reading”, footer links: comfortable spacing.
- [ ] **contact.html / faq.html:** nav pills and footer links: tappable.

---

## Form validation checklist

- [ ] **restore.html — Transaction ID:** empty submit shows a clear message; invalid format shows a different message; both tie to the field for screen readers.
- [ ] **restore.html — Not found:** error panel is visible, focus returns to the field (or a documented intentional choice).
- [ ] **index.html — Password gate:** wrong phrase shows error text and `aria-invalid`; success hides gate and restores page interaction.
- [ ] **index.html — Reading flow:** if step validation exists, errors are visible, labeled, and not color-only.

---

## Modal / overlay checklist

- [ ] **Password gate (`index.html`):** while open, background content is not keyboard-reachable (`inert` / equivalent); **Tab** cycles within the gate; **Escape** does not close it but gives an appropriate message (intentional “no bypass”).
- [ ] **After gate closes:** `inert` is removed, skip link returns to normal tab order, focus is not trapped.
- [ ] **PayPal:** opens a **new tab/window**—not an in-page modal; no focus trap required on the original page while PayPal is open; after paid unlock, focus should land in the **full reading** content.
- [ ] **Any new modal added later:** trap focus, restore focus to the opener on close, mark background inert, **Escape** closes if cancel is allowed, and name the dialog (`aria-labelledby` / `aria-describedby`).

---

## Color contrast spot-check

Use browser **Accessibility** panel or a contrast checker on **real text** (not images of text).

- [ ] **Body text** on main backgrounds: readable (aim for **4.5:1** normal text, **3:1** large text—WCAG AA).
- [ ] **Links and buttons** (default + **focus** state): visible against background.
- [ ] **Muted / helper text** (placeholders, hints, footers): still readable; if too light, flag for design.
- [ ] **Error text** and **inline validation**: not indicated by color alone (icons/text always present).
- [ ] **index.html — pink/wine/cream theme** and **inner pages — gold/panel theme:** spot-check hero, paywall, and form fields after theme tweaks.

---

## Quick flow map (what to exercise)

| Flow | Where | What to verify |
|------|--------|----------------|
| Password gate | `index.html` | Trap, announcements, success focus |
| Hero CTA | `index.html` | Jump into flow, focus makes sense |
| Reading flow | `index.html` | Steps, validation, landmarks |
| Reveal | `index.html` | Keyboard flip, SR labels, then preview |
| Preview / paywall | `index.html` | Region, pay, verify, unlock focus |
| Restore | `restore.html` | Form errors, success focus, reduced motion |
| Contact | `contact.html` | Sections, links, tap targets |
| FAQ | `faq.html` | Accordions, headings, keyboard |

---

## If something fails

1. Note **page**, **browser**, **assistive tech**, and **exact steps**.  
2. Check whether the change introduced **new** components without labels, **wrong heading levels**, or **removed** `main` / skip link / `focus-visible` styles.  
3. Prefer fixes that match existing patterns in `index.html` (skip link, `#main-content`, `announce()`, `inert`, live regions).

*Last aligned with site patterns as of project updates (password gate, reading flow, restore/contact/FAQ inner pages).*
