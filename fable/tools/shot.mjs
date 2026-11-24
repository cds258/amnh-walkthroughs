// Headless screenshot harness.
// usage: node tools/shot.mjs <outDir> [--url=http://localhost:5173/] [--size=1280x720] name=goto:roomOrExhibitId[:view] name=tp:x,y,z,yaw,pitch name=eval:<js> ...
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const outDir = args.shift();
let url = 'http://localhost:5173/';
let size = [1280, 720];
let ui = false;
const shots = [];
for (const a of args) {
  if (a.startsWith('--url=')) url = a.slice(6);
  else if (a.startsWith('--size=')) size = a.slice(7).split('x').map(Number);
  else if (a === '--ui') ui = true;
  else shots.push(a);
}
fs.mkdirSync(outDir, { recursive: true });
const base = path.join(os.homedir(), '.cache/ms-playwright');
const dir = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const exe = path.join(base, dir, 'chrome-linux64/chrome');
const browser = await chromium.launch({
  executablePath: exe, headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + (e.stack || '')));
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction('window.AMNH && window.AMNH.ready', null, { timeout: 180000 });
console.log('ready in', ((Date.now() - t0) / 1000).toFixed(1), 's');
await page.evaluate(() => { document.getElementById('enter').click(); });
await page.addStyleTag({ content: '#start{display:none!important}' + (ui ? '' : '#hud{display:none!important}') });
await page.waitForTimeout(700);
for (const s of shots) {
  const eq = s.indexOf('=');
  const name = s.slice(0, eq), cmd = s.slice(eq + 1);
  const kind = cmd.slice(0, cmd.indexOf(':')), rest = cmd.slice(cmd.indexOf(':') + 1);
  try {
    if (kind === 'goto') { const [id, view] = rest.split(':'); await page.evaluate(([i, v]) => window.AMNH.goto(i, v || 'main'), [id, view]); }
    else if (kind === 'tp') { const v = rest.split(',').map(Number); await page.evaluate((q) => window.AMNH.tp(...q), v); }
    else if (kind === 'eval') { const r = await page.evaluate(rest); if (r !== undefined) console.log(name, '=>', JSON.stringify(r)); }
    await page.waitForTimeout(450);
    if (kind !== 'eval' || name.startsWith('shot')) {
      await page.screenshot({ path: path.join(outDir, name + '.jpg'), type: 'jpeg', quality: 80 });
      const st = await page.evaluate(() => window.AMNH.stats());
      console.log(name, JSON.stringify(st));
    }
  } catch (e) { console.log('FAILED', name, e.message); }
}
if (errors.length) console.log('--- console ---\n' + [...new Set(errors)].slice(0, 30).join('\n'));
await browser.close();
