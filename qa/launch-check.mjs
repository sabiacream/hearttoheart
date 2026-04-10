/**
 * Pre-launch: crawl main HTML pages, collect console + failed requests, verify internal links.
 * Run with: BASE=http://127.0.0.1:8787 node qa/launch-check.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8787';

const PAGES = ['/', '/about.html', '/contact.html', '/faq.html', '/restore.html', '/terms.html'];

function resolveUrl(href, baseUrl) {
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const u = new URL(href);
      if (u.origin !== new URL(baseUrl).origin) return { external: true, ok: true };
      return { path: u.pathname + u.search + u.hash };
    }
    if (href.startsWith('//')) return { external: true, ok: true };
    if (href.startsWith('#')) return { ok: true, hashOnly: true };
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return { ok: true };
    const resolved = new URL(href, baseUrl);
    if (resolved.origin !== new URL(baseUrl).origin) return { external: true, ok: true };
    return { path: resolved.pathname + resolved.search + resolved.hash };
  } catch {
    return { ok: false, error: 'bad url' };
  }
}

function fileExistsForPath(urlPath) {
  let p = urlPath.split('#')[0].split('?')[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  if (p === '/' || p === '') p = '/index.html';
  const abs = path.join(ROOT, p.replace(/^\//, ''));
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
  if (fs.existsSync(abs + '.html') && fs.statSync(abs + '.html').isFile()) return true;
  if (p.endsWith('/') && fs.existsSync(path.join(abs, 'index.html'))) return true;
  return false;
}

async function crawlPage(browser, pagePath) {
  const url = pagePath.startsWith('http') ? pagePath : `${BASE.replace(/\/$/, '')}${pagePath}`;
  const consoleMsgs = [];
  const failed = [];
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error' || t === 'warning') consoleMsgs.push({ type: t, text: msg.text() });
  });
  page.on('pageerror', (err) => {
    consoleMsgs.push({ type: 'pageerror', text: String(err.message || err) });
  });
  page.on('requestfailed', (req) => {
    failed.push({ url: req.url(), failure: req.failure()?.errorText || 'unknown' });
  });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const status = response?.status() ?? 0;
  await page.waitForTimeout(800);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter(Boolean));
  const srcs = await page.$$eval('[src]:not(script)', (els) =>
    els.map((e) => e.getAttribute('src')).filter(Boolean)
  );
  const linkHrefs = await page.$$eval('link[href]', (els) =>
    els.map((e) => e.getAttribute('href')).filter(Boolean)
  );
  const broken = [];
  for (const href of [...new Set(hrefs)]) {
    const r = resolveUrl(href, url);
    if (r.ok && r.hashOnly) continue;
    if (r.external) continue;
    if (r.path && !fileExistsForPath(r.path)) broken.push({ kind: 'a', href, resolved: r.path });
  }
  for (const src of [...new Set(srcs)]) {
    const r = resolveUrl(src, url);
    if (r.external) continue;
    if (r.path && !fileExistsForPath(r.path)) broken.push({ kind: 'src', href: src, resolved: r.path });
  }
  for (const href of [...new Set(linkHrefs)]) {
    if (href.startsWith('https://fonts.') || href.startsWith('https://www.paypal')) continue;
    const r = resolveUrl(href, url);
    if (r.external) continue;
    if (r.path && !fileExistsForPath(r.path)) broken.push({ kind: 'link', href, resolved: r.path });
  }
  await context.close();
  return { url, status, consoleMsgs, failed, broken };
}

async function testPasswordGate(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => sessionStorage.removeItem('pw-ok'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#pw-input', { timeout: 15000 });
  await page.fill('#pw-input', 'tarot2026');
  await page.click('#pw-btn');
  await page.waitForTimeout(600);
  const hidden = await page.evaluate(() => {
    const g = document.getElementById('pw-gate');
    return g && (g.style.display === 'none' || getComputedStyle(g).display === 'none');
  });
  const ss = await page.evaluate(() => sessionStorage.getItem('pw-ok'));
  await context.close();
  return { hidden, sessionPwOk: ss, errors };
}

async function testReducedMotion(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem('pw-ok');
    } catch (_) {}
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pw-gate__card-float', { timeout: 15000 });
  const floatAnim = await page.$eval('.pw-gate__card-float', (el) => getComputedStyle(el).animationName);
  const fhAnim = await page.$eval('.hbg .fh', (el) => getComputedStyle(el).animationName);
  const bodyBefore = await page.evaluate(() => {
    const s = getComputedStyle(document.body, '::before');
    return { content: s.content, animationName: s.animationName };
  });
  await context.close();
  return { floatAnim, fhAnim, bodyBeforeAnimation: bodyBefore.animationName, bodyBeforeContent: bodyBefore.content };
}

async function main() {
  const browser = await chromium.launch();
  const results = { pages: [], password: null, reducedMotion: null };
  for (const p of PAGES) {
    results.pages.push(await crawlPage(browser, p));
  }
  results.password = await testPasswordGate(browser);
  results.reducedMotion = await testReducedMotion(browser);
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
