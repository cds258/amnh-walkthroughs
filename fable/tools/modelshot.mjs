// Render models from src/models/<lib>.js to JPEG triptychs (side | three-quarter | front).
// usage: node tools/modelshot.mjs <outDir> <lib> <name>[,<name>...|all] [--opts='{"k":1}'] [--size=1500x520] [--dio]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const pos = args.filter((a) => !a.startsWith('--'));
const [outDir, lib, namesArg] = pos;
const flag = (n, d) => { const f = flags.find((a) => a.startsWith('--' + n + '=')); return f ? f.slice(n.length + 3) : d; };
const size = flag('size', '1500x520').split('x').map(Number);
const opts = flag('opts', '');
const url = flag('url', 'http://localhost:5173/');
fs.mkdirSync(outDir, { recursive: true });
const base = path.join(os.homedir(), '.cache/ms-playwright');
const dir = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({
  executablePath: path.join(base, dir, 'chrome-linux64/chrome'), headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(url + 'viewer.html', { waitUntil: 'load' });
await page.waitForFunction('window.VIEW && window.VIEW.ready');
let names = namesArg.split(',');
if (namesArg === 'all') names = await page.evaluate((l) => window.VIEW.names(l), lib);
for (const name of names) {
  try {
    const info = await page.evaluate(([l, n, o]) => window.VIEW.setModel(l, n, o ? JSON.parse(o) : {}), [lib, name, opts]);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${lib}-${name}.jpg`), type: 'jpeg', quality: 82 });
    console.log(name, 'size', info.size.map((v) => v.toFixed(2)).join(' x '), 'verts', info.verts, 'minY', info.min[1].toFixed(2));
  } catch (e) { console.log('FAILED', name, e.message.split('\n')[0]); }
}
if (errors.length) console.log('--- console errors ---\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close();
