#!/usr/bin/env node
// Generate branded illustration assets for the fasttrack guide site via Gemini image API.
// Usage: GEMINI_API_KEY=... node scripts/gen-image.mjs <outfile.png> "<prompt>" [widescreen|square]
import fs from 'node:fs';
import path from 'node:path';

const envFile = '/Users/kazu.nx/devin_app/so-chu-nhiem/.env.local';
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split('\n')
    .filter(l => /^[A-Z_]+=/.test(l))
    .map(l => [l.split('=')[0], l.split('=').slice(1).join('=').replace(/^["']|["']$/g, '')])
);
const keys = ['GEMINI_API_KEY','GEMINI_API_KEY_2','GEMINI_API_KEY_3','GEMINI_API_KEY_4','GEMINI_API_KEY_5','GEMINI_API_KEY_6','GEMINI_API_KEY_7']
  .map(k => env[k]).filter(Boolean);
if (!keys.length) { console.error('no GEMINI key'); process.exit(1); }

const [, , out, prompt, shape = 'widescreen'] = process.argv;
if (!out || !prompt) { console.error('usage: gen-image.mjs out.png "prompt" [shape]'); process.exit(1); }

const models = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview', 'gemini-2.0-flash-preview-image-generation'];
const aspect = shape === 'square' ? '1:1' : '16:9';

async function tryGen(key, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } },
  };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${model}: ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  const part = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data || p.inline_data?.data);
  if (!part) throw new Error(`${model}: no image part`);
  return Buffer.from((part.inlineData || part.inline_data).data, 'base64');
}

let buf, err;
outer:
for (const model of models) {
  for (const key of keys) {
    try { buf = await tryGen(key, model); console.log(`ok: ${model}`); break outer; }
    catch (e) { err = e; }
  }
}
if (!buf) { console.error('all failed:', err?.message); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log(`wrote ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
