#!/usr/bin/env node
// One-shot media + breadcrumb injection for guide pages (SEO starter guide:
// images near relevant text w/ descriptive alt, BreadcrumbList for SERP).
// Idempotent: skips pages that already have <img inside <main or BreadcrumbList.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('.', import.meta.url).pathname;
const SITE = 'https://fasttrack.vieschool.com';

// filename -> { img, alt, caption } - explicit per page so alt text describes
// the image's relationship to THAT page's content (Google's requirement).
const MAP = {
  // --- queue / airport pages ---
  'da-nang-airport-fast-track.html': 'queue',
  'noi-bai-airport-fast-track.html': 'queue',
  'tan-son-nhat-airport-fast-track.html': 'queue',
  'phu-quoc-cam-ranh-fast-track.html': 'queue',
  'hanoi-airport-immigration-time.html': 'queue',
  'ho-chi-minh-airport-immigration-time.html': 'queue',
  'vietnam-immigration-wait-times.html': 'queue',
  'vietnam-airport-fast-track-christmas-new-year.html': 'queue',
  'vietnam-airport-fast-track-peak-seasons.html': 'queue',
  'vietnam-airport-fast-track-tet.html': 'queue',
  'vietnam-airport-fast-track-cost.html': 'queue',
  'zh-wait-times.html': 'queue',
  'zh-da-nang-airport.html': 'queue',
  'zh-noi-bai-airport.html': 'queue',
  'zh-tan-son-nhat-airport.html': 'queue',
  'zh-chunjie-peak.html': 'queue',
  // --- transit ---
  'vietnam-airport-transit-fast-track.html': 'transit',
  'zh-transit-guide.html': 'transit',
  // --- family ---
  'vietnam-fast-track-families-groups.html': 'family',
  'zh-families-elderly.html': 'family',
  // --- departure ---
  'vietnam-airport-departure-fast-track.html': 'departure',
  'zh-departure-fast-track.html': 'departure',
  // --- review / comparison ---
  'avia-fast-track-review.html': 'review',
  'avilink-fast-track-review.html': 'review',
  'entryvn-fast-track-review.html': 'review',
  'fasttrackvns-review.html': 'review',
  'heera-travel-fast-track-review.html': 'review',
  'newway-sas-fast-track-review.html': 'review',
  'vietnamfasttrackservice-review.html': 'review',
  'vjp-fast-track-review.html': 'review',
  'vietnam-fast-track-companies.html': 'review',
  'vietnam-fast-track-klook-trip-com.html': 'review',
  'vietnam-airport-fast-track-worth-it.html': 'review',
  'vietnam-fast-track-tiers-explained.html': 'review',
  // --- evisa / documents ---
  'vietnam-evisa-fast-track-guide.html': 'evisa',
  'vietnam-evisa-for-indians.html': 'evisa',
  'vietnam-evisa-processing-time.html': 'evisa',
  'vietnam-visa-on-arrival-vs-evisa.html': 'evisa',
  'vietnam-arrival-card.html': 'evisa',
  'zh-evisa-guide.html': 'evisa',
  // --- sim ---
  'vietnam-airport-sim-card.html': 'sim',
  // --- reuse existing meet-greet for topic-matching pages ---
  'vietnam-airport-meet-and-greet.html': 'meet',
  'zh-index.html': 'meet',
};

const SCENES = {
  queue: { file: 'queue-scene.svg' },
  transit: { file: 'transit-scene.svg' },
  family: { file: 'family-scene.svg' },
  departure: { file: 'departure-scene.svg' },
  review: { file: 'review-scene.svg' },
  evisa: { file: 'evisa-scene.svg' },
  sim: { file: 'sim-scene.svg' },
  meet: { file: 'meet-greet-scene.svg' },
};

const ALT = {
  en: {
    queue: 'Flat illustration: travelers wait in a roped queue under an IMMIGRATION sign at a Vietnam airport, beside a wall clock - the wait this guide measures.',
    transit: 'Flat illustration: a traveler with a rolling suitcase walks between T1 and T2 terminal signs following a direction arrow - the transfer this guide explains.',
    family: 'Flat illustration: a family with a stroller and an elderly traveler with a cane walks through a Vietnam airport with an escort agent - the group travel this guide covers.',
    departure: 'Flat illustration: a check-in counter under a DEPARTURES flight board at a Vietnam airport - the departure process this guide walks through.',
    review: 'Flat illustration: a clipboard checklist with checkmarks and one cross beside a magnifier and five rating stars - how this review scores the service.',
    evisa: 'Flat illustration: a Vietnam e-visa approval letter stamped APPROVED next to a passport and an e-visa portal screen - the document this guide explains.',
    sim: 'Flat illustration: a smartphone with a SIM card being inserted, signal waves, and Vietnamese carrier chips - the SIM options this guide compares.',
    meet: 'Flat illustration: an agent holds a WELCOME name board for a traveler with a suitcase beside the PRIORITY LANE sign at a Vietnam airport.',
  },
  zh: {
    queue: '扁平插画:旅客在越南机场IMMIGRATION标志下的蛇形队伍中排队,旁边有挂钟 - 对应本文的排队时长实测。',
    transit: '扁平插画:旅客拖着行李箱沿指示牌在T1与T2航站楼之间转机 - 对应本文讲解的转机流程。',
    family: '扁平插画:一家人推着婴儿车、搀扶老人在越南机场由接机员陪同 - 对应本文的家庭出行方案。',
    departure: '扁平插画:越南机场值机柜台与DEPARTURES航班信息屏 - 对应本文讲解的出境流程。',
    review: '扁平插画:带勾选框的评分清单、放大镜与五颗星级 - 对应本文的服务评测方式。',
    evisa: '扁平插画:盖有APPROVED章的越南电子签证批准函与护照、申请页面 - 对应本文讲解的签证文件。',
    sim: '扁平插画:手机插入SIM卡、信号波纹与越南运营商选项 - 对应本文对比的上网卡方案。',
    meet: '扁平插画:接机员在越南机场PRIORITY LANE旁举牌等候携带行李的旅客。',
  },
};

const CAPTION = {
  en: {
    queue: 'Illustration - immigration queues at Vietnam airports vary by airport, time of day and season.',
    transit: 'Illustration - international-to-domestic transfers mean entering Vietnam first, then changing terminals.',
    family: 'Illustration - families and elderly travelers move through the airport together with an escort.',
    departure: 'Illustration - departure means three queues: check-in, security and exit immigration.',
    review: 'Illustration - each service is scored on what is verifiable: meet point, lane access, paperwork handling.',
    evisa: 'Illustration - the e-visa is a PDF approval letter you print and carry with your passport.',
    sim: 'Illustration - a local SIM with data is the cheapest way to get online right after landing.',
    meet: 'Illustration - your agent meets you at the gate with a name board and walks you through priority immigration.',
  },
  zh: {
    queue: '示意图 - 越南各机场入境排队时长因机场、时段和季节差异很大。',
    transit: '示意图 - 国际转国内必须先入境取行李,再换航站楼重新值机。',
    family: '示意图 - 带小孩和老人的家庭可由陪同人员一起走快速通道。',
    departure: '示意图 - 出境有三道队:值机托运、安检、出境移民。',
    review: '示意图 - 评测只看可验证项:接机点、快速通道、签证手续。',
    evisa: '示意图 - 电子签证是一份PDF批准函,打印后与护照一起携带。',
    sim: '示意图 - 落地后买本地流量SIM卡是最划算的上网方式。',
    meet: '示意图 - 接机员在舱门口举牌等候,陪同走优先通道。',
  },
};

const SCENE_CSS = `.scene{margin:32px 0 0;border-radius:16px;overflow:hidden;border:1px solid var(--line,#22345a)}
.scene img{display:block;width:100%;height:auto}
.scene figcaption{background:var(--panel,#101a30);padding:10px 16px;font-size:.78rem;color:var(--mut,#9aa4b8)}`;

const files = readdirSync(ROOT).filter((f) => f.endsWith('.html') && MAP[f]);
let nImg = 0, nBc = 0;
const touched = [];

for (const f of files) {
  let html = readFileSync(ROOT + f, 'utf8');
  const isZh = f.startsWith('zh-');
  const lang = isZh ? 'zh' : 'en';
  let changed = false;

  // --- image ---
  if (!/<img[^>]+src="assets\//.test(html)) {
    const scene = MAP[f];
    const figure =
      `  <figure class="scene">\n` +
      `    <img src="assets/img/${SCENES[scene].file}" alt="${ALT[lang][scene]}" width="1200" height="675" loading="lazy">\n` +
      `    <figcaption>${CAPTION[lang][scene]}</figcaption>\n` +
      `  </figure>\n`;
    // inject CSS if .scene class not defined
    if (!/\.scene\s*\{/.test(html)) {
      html = html.replace('</style>', `${SCENE_CSS}\n</style>`);
    }
    // insert figure right after <main...> opening tag (+ optional wrap div)
    const m = html.match(/<main[^>]*>(\s*<div[^>]*>)?/);
    if (m) {
      html = html.slice(0, m.index + m[0].length) + '\n' + figure + html.slice(m.index + m[0].length);
      changed = true; nImg++;
    } else {
      console.warn('NO <main>:', f);
    }
  }

  // --- breadcrumb ---
  if (!html.includes('BreadcrumbList')) {
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
    if (h1) {
      const home = isZh ? '首页' : 'Home';
      const bc = `<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[\n{"@type":"ListItem","position":1,"name":"${home}","item":"${SITE}/"},\n{"@type":"ListItem","position":2,"name":${JSON.stringify(h1)},"item":"${SITE}/${f}"}]}\n</script>`;
      html = html.replace('</head>', bc + '\n</head>');
      changed = true; nBc++;
    }
  }

  if (changed) { writeFileSync(ROOT + f, html); touched.push(f); }
}

console.log(`img injected: ${nImg}, breadcrumb injected: ${nBc}, files touched: ${touched.length}`);
console.log(touched.join('\n'));
