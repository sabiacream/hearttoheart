import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'Tarot Images', 'Card Sized');

const missingCards = [
  { n: 'Queen of Cups', u: 'Q', suit: 'Cups', rank: 'Queen' },
  { n: 'Five of Swords', u: '5', suit: 'Swords', rank: 'Five' },
  { n: 'Six of Swords', u: '6', suit: 'Swords', rank: 'Six' },
  { n: 'Seven of Swords', u: '7', suit: 'Swords', rank: 'Seven' },
  { n: 'Eight of Swords', u: '8', suit: 'Swords', rank: 'Eight' },
  { n: 'Nine of Swords', u: '9', suit: 'Swords', rank: 'Nine' },
  { n: 'Ten of Swords', u: '10', suit: 'Swords', rank: 'Ten' },
  { n: 'Five of Pentacles', u: '5', suit: 'Pentacles', rank: 'Five' }
];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function suitIcon(suit, x, y, scale = 1, cls = 'shape') {
  const s = scale;
  if (suit === 'Cups') {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path class="${cls}" d="M-5 -4h10c0 5-2 8-5 8s-5-3-5-8z"/>
      <path class="${cls}" d="M-2 4h4M0 4v4M-4 8h8"/>
    </g>`;
  }
  if (suit === 'Swords') {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path class="${cls}" d="M0 8V-8"/>
      <path class="${cls}" d="M0-8l2 3H-2z"/>
      <path class="${cls}" d="M-3 3h6M-2 5h4"/>
    </g>`;
  }
  return `<g transform="translate(${x},${y}) scale(${s})">
    <circle class="${cls}" cx="0" cy="0" r="6"/>
    <path class="soft" d="M0-4l1.2 3.2H5l-3 2.1 1.2 3.5L0 2.8l-3.2 2 1.2-3.5-3-2.1h3.8z"/>
  </g>`;
}

function sceneFor(card) {
  if (card.n === 'Queen of Cups') {
    return `${suitIcon('Cups',35,28,.95)}<path class="shape" d="M18 42h24"/><path class="soft" d="M22 24c3-3 11-3 14 0"/>`;
  }
  if (card.n === 'Five of Swords') {
    return `${suitIcon('Swords',21,34,.7)}${suitIcon('Swords',27,36,.7)}${suitIcon('Swords',33,38,.7)}${suitIcon('Swords',41,24,.7)}${suitIcon('Swords',47,26,.7)}<path class="shape" d="M18 20c4 0 8 2 10 6"/>`;
  }
  if (card.n === 'Six of Swords') {
    return `${suitIcon('Swords',18,18,.62)}${suitIcon('Swords',24,18,.62)}${suitIcon('Swords',30,18,.62)}${suitIcon('Swords',36,18,.62)}${suitIcon('Swords',42,18,.62)}${suitIcon('Swords',48,18,.62)}<path class="shape" d="M16 42h28"/><path class="soft" d="M21 42c3-6 10-10 17-10"/>`;
  }
  if (card.n === 'Seven of Swords') {
    return `${suitIcon('Swords',18,18,.6)}${suitIcon('Swords',24,18,.6)}${suitIcon('Swords',30,18,.6)}${suitIcon('Swords',36,18,.6,'soft')}${suitIcon('Swords',42,18,.6,'soft')}${suitIcon('Swords',48,18,.6,'soft')}${suitIcon('Swords',32,36,.6)}<path class="shape" d="M18 44c4-6 9-9 14-10"/>`;
  }
  if (card.n === 'Eight of Swords') {
    return `${suitIcon('Swords',18,18,.58)}${suitIcon('Swords',42,18,.58)}${suitIcon('Swords',18,28,.58)}${suitIcon('Swords',42,28,.58)}${suitIcon('Swords',18,38,.58)}${suitIcon('Swords',42,38,.58)}${suitIcon('Swords',18,48,.58)}${suitIcon('Swords',42,48,.58)}<path class="shape" d="M30 46c-4-5-4-13 0-18"/><path class="soft" d="M26 24c2-2 6-2 8 0"/>`;
  }
  if (card.n === 'Nine of Swords') {
    return `${suitIcon('Swords',18,18,.56)}${suitIcon('Swords',24,18,.56)}${suitIcon('Swords',30,18,.56)}${suitIcon('Swords',36,18,.56)}${suitIcon('Swords',42,18,.56)}${suitIcon('Swords',18,26,.56)}${suitIcon('Swords',24,26,.56)}${suitIcon('Swords',30,26,.56)}${suitIcon('Swords',36,26,.56)}<path class="shape" d="M18 44h16"/><path class="soft" d="M40 43c-3-4-4-8-4-13"/>`;
  }
  if (card.n === 'Ten of Swords') {
    return `${suitIcon('Swords',18,22,.5)}${suitIcon('Swords',22,24,.5)}${suitIcon('Swords',26,26,.5)}${suitIcon('Swords',30,28,.5)}${suitIcon('Swords',34,30,.5)}${suitIcon('Swords',38,32,.5)}${suitIcon('Swords',42,34,.5)}${suitIcon('Swords',46,36,.5)}${suitIcon('Swords',50,38,.5)}${suitIcon('Swords',54,40,.5)}<path class="soft" d="M16 49c5-2 9-3 14-3"/><path class="soft" d="M42 49c3-4 6-6 10-7"/>`;
  }
  if (card.n === 'Five of Pentacles') {
    return `${suitIcon('Pentacles',22,24,.62,'soft')}${suitIcon('Pentacles',38,24,.62,'soft')}${suitIcon('Pentacles',22,38,.62,'soft')}${suitIcon('Pentacles',38,38,.62,'soft')}${suitIcon('Pentacles',30,31,.62,'soft')}<path class="shape" d="M16 46c4-6 8-9 14-10"/><path class="shape" d="M42 45c-2-4-3-8-3-12"/>`;
  }
  throw new Error(`No scene configured for ${card.n}`);
}

function getCardPalette(card) {
  const palettes = {
    Cups: { paper: '#eef8f8', panel: '#fbfffd', ink: '#355761', soft: '#6f95a6', fill: '#4d7d8d', glow: '#d6ebee', band: '#dceff1' },
    Swords: { paper: '#f1f3f7', panel: '#fcfdff', ink: '#454d59', soft: '#8d98ac', fill: '#626a7d', glow: '#dde4ee', band: '#e4e9f1' },
    Pentacles: { paper: '#f7f2e5', panel: '#fffdf6', ink: '#584c31', soft: '#b89b57', fill: '#8c7740', glow: '#efe2ba', band: '#efe6c7' }
  };
  return palettes[card.suit];
}

function renderCard(card) {
  const palette = getCardPalette(card);
  const safeName = card.n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const bgId = `bg-${safeName}`;
  const glowId = `glow-${safeName}`;
  const sub = `${card.rank.toLowerCase()} of ${card.suit.toLowerCase()}`;
  const art = sceneFor(card);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" aria-hidden="true">
    <defs>
      <linearGradient id="${bgId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.paper}"/>
        <stop offset="100%" stop-color="${palette.panel}"/>
      </linearGradient>
      <radialGradient id="${glowId}" cx=".5" cy=".28" r=".7">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity=".95"/>
        <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
      </radialGradient>
      <style>
        .line,.shape,.pip{stroke:${palette.ink};stroke-width:1.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
        .soft{stroke:${palette.soft};stroke-width:1;fill:none;stroke-linecap:round;stroke-linejoin:round}
        .fill{fill:${palette.fill};stroke:none}
        .glyph,.label,.title{font-family:Fraunces, Georgia, serif;fill:${palette.ink};stroke:none}
      </style>
    </defs>
    <rect x="1.5" y="1.5" width="57" height="77" rx="8" fill="url(#${bgId})"/>
    <rect x="4" y="4" width="52" height="72" rx="6" fill="${palette.panel}" opacity=".94"/>
    <rect x="4" y="4" width="52" height="72" rx="6" fill="url(#${glowId})" opacity=".8"/>
    <path class="soft" d="M12 12h36"/>
    <circle cx="30" cy="12" r="2.1" fill="${palette.fill}" opacity=".9"/>
    <path class="soft" d="M16 18c3-3 8-5 14-5s11 2 14 5"/>
    <g transform="translate(0,1)">${art}</g>
    <rect x="10" y="60.5" width="40" height="9" rx="4.5" fill="${palette.band}" opacity=".9"/>
    <text class="label" x="30" y="66.7" text-anchor="middle">${escapeHtml(sub.toUpperCase())}</text>
    <text class="title" x="30" y="74.5" text-anchor="middle" font-size="5.7">${escapeHtml(card.u)}</text>
  </svg>`;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  for (const card of missingCards) {
    const filepath = path.join(outputDir, `${card.n}.svg`);
    await fs.writeFile(filepath, renderCard(card), 'utf8');
    console.log(`generated ${path.basename(filepath)}`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
