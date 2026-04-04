import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const baseUrl = 'http://127.0.0.1:8787';

function startServer() {
  const child = spawn('npm', ['start'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  return { child, getLogs: () => logs };
}

async function waitForServer(getLogs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
      if (response.ok) {
        return;
      }
    } catch {}
    await delay(250);
  }
  throw new Error(`Server did not become ready.\n${getLogs()}`);
}

function normalizeSentences(text) {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) =>
      sentence
        .toLowerCase()
        .replace(/[“”‘’"']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
}

async function run() {
  const { child, getLogs } = startServer();
  let browser;

  try {
    await waitForServer(getLogs);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const signalCheck = await page.evaluate(() =>
      inferQuestionSignals('Will he come back and text me again soon?', 'love')
    );
    assert.equal(signalCheck.relationship, true, 'Relationship signal should be detected.');
    assert.equal(signalCheck.reconciliation, true, 'Reconciliation signal should be detected.');
    assert.equal(signalCheck.communication, true, 'Communication signal should be detected.');
    assert.equal(signalCheck.timing, true, 'Timing signal should be detected.');

    const contextualReadings = await page.evaluate(() => {
      function fixedRender(category, trinket, question) {
        const fixedCards = [
          { ...DK.find((card) => card.n === 'The Lovers'), reversed: false },
          { ...DK.find((card) => card.n === 'Ace of Swords'), reversed: false },
          { ...DK.find((card) => card.n === 'Ten of Pentacles'), reversed: false }
        ];
        cat = category;
        chosenT = trinket;
        spN = 3;
        document.getElementById('qinput').value = question;
        document.getElementById('moon').value = '';
        document.getElementById('zod').value = '';
        drawn = fixedCards.map((card) => ({ ...card }));
        const ctx = buildContext();
        readingSalt = makeReadingSalt({ ...ctx, drawSignature: buildDrawSignature(drawn) });
        return {
          overview: buildOverview(ctx),
          closing: buildClosing(ctx),
          firstCard: buildCardInterpretation(drawn[0], POS[spN][0], ctx, 0)
        };
      }

      return {
        love: fixedRender('love', 'heart', 'Will he come back and text me again soon?'),
        career: fixedRender('career', 'owl', 'Should I take the new job offer?')
      };
    });

    assert.notEqual(
      contextualReadings.love.overview,
      contextualReadings.career.overview,
      'Overview text should shift when category and trinket change.'
    );
    assert.match(
      contextualReadings.love.closing,
      /heart|love|emotional/i,
      'Love reading should reflect the chosen heart/love context.'
    );
    assert.match(
      contextualReadings.career.closing,
      /owl|career|work|strategic/i,
      'Career reading should reflect the chosen owl/career context.'
    );

    const variationCheck = await page.evaluate(() => {
      function buildTextReading(category, trinket, question) {
        cat = category;
        chosenT = trinket;
        spN = 3;
        document.getElementById('qinput').value = question;
        document.getElementById('moon').value = '';
        document.getElementById('zod').value = '';
        const ctx = buildContext();
        drawn = drawWithVariety(reversedChance(ctx), ctx);
        readingSalt = makeReadingSalt({ ...ctx, drawSignature: buildDrawSignature(drawn) });
        const wrap = document.createElement('div');
        wrap.innerHTML = buildReadingHtml(ctx, false);
        return {
          signature: buildDrawSignature(drawn),
          text: wrap.innerText
        };
      }

      localStorage.clear();
      const runs = [];
      for (let i = 0; i < 6; i += 1) {
        runs.push(buildTextReading('love', 'heart', 'Will he come back and text me again soon?'));
      }

      return runs;
    });

    const uniqueSignatures = new Set(variationCheck.map((entry) => entry.signature)).size;
    assert.ok(uniqueSignatures >= 3, `Expected at least 3 unique draws, saw ${uniqueSignatures}.`);

    const exactQuestion = 'Will he come back and text me again soon?';
    const maxQuestionRepeats = Math.max(
      ...variationCheck.map((entry) => (entry.text.match(new RegExp(exactQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length)
    );
    assert.ok(
      maxQuestionRepeats <= 2,
      `Question text is being echoed too many times (${maxQuestionRepeats}).`
    );

    const maxDuplicateSentenceCount = Math.max(
      ...variationCheck.map((entry) => {
        const counts = new Map();
        for (const sentence of normalizeSentences(entry.text)) {
          counts.set(sentence, (counts.get(sentence) || 0) + 1);
        }
        return Math.max(...counts.values(), 0);
      })
    );
    assert.equal(
      maxDuplicateSentenceCount,
      1,
      `Found duplicated sentences in a generated reading (max repeat ${maxDuplicateSentenceCount}).`
    );

    const biasCheck = await page.evaluate(() => {
      function sample(category, trinket, question, featuredCards) {
        const totals = { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0, featured: 0, totalCards: 0 };
        cat = category;
        chosenT = trinket;
        spN = 3;
        document.getElementById('moon').value = '';
        document.getElementById('zod').value = '';

        for (let i = 0; i < 160; i += 1) {
          document.getElementById('qinput').value = question;
          const ctx = buildContext();
          const cards = drawBiasedCards(ctx, reversedChance(ctx));
          cards.forEach((card) => {
            if (card.suit) totals[card.suit] += 1;
            if (featuredCards.includes(card.n)) totals.featured += 1;
            totals.totalCards += 1;
          });
        }
        return totals;
      }

      return {
        heartLove: sample('love', 'heart', 'Will he come back and text me again soon?', ['Two of Cups', 'The Lovers', 'Knight of Cups']),
        owlCareer: sample('career', 'owl', 'Should I take the new job offer?', ['Ace of Swords', 'The Hermit', 'Three of Pentacles'])
      };
    });

    const heartCupRate = biasCheck.heartLove.Cups / biasCheck.heartLove.totalCards;
    const heartSwordRate = biasCheck.heartLove.Swords / biasCheck.heartLove.totalCards;
    const owlSwordRate = biasCheck.owlCareer.Swords / biasCheck.owlCareer.totalCards;
    const owlCupRate = biasCheck.owlCareer.Cups / biasCheck.owlCareer.totalCards;

    assert.ok(
      heartCupRate > heartSwordRate,
      `Heart/love readings should lean more Cups than Swords. Saw Cups=${heartCupRate}, Swords=${heartSwordRate}.`
    );
    assert.ok(
      owlSwordRate > owlCupRate,
      `Owl/career readings should lean more Swords than Cups. Saw Swords=${owlSwordRate}, Cups=${owlCupRate}.`
    );
    assert.ok(
      biasCheck.heartLove.featured > 0 && biasCheck.owlCareer.featured > 0,
      'Expected featured category/trinket cards to appear in aggregate samples.'
    );

    console.log('reading-engine-check: ok');
  } finally {
    if (browser) {
      await browser.close();
    }
    if (!child.killed) {
      child.kill('SIGTERM');
      await delay(250);
      if (!child.killed) child.kill('SIGKILL');
    }
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
