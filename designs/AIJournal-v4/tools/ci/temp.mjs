// Disposable browsers and temp folders, cleaned up for real.
//
// On Windows, child.kill() ends only the browser's parent process: its renderer and GPU
// processes live on, keep holding the profile (so it can't be deleted) and leave their own
// scoped_dir* folders behind. Leftovers from the check tools filled a 119 GB disk once
// (2026-10-10), so: kill the whole tree, and sweep old leftovers whenever the checks start.
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';

export function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGKILL'); } catch {} try { child.kill('SIGKILL'); } catch {} }
}

// Temp folders the check tools and the browsers they start create. Only these, and only once
// they are older than maxAgeHours, so a run in progress is never touched.
// A project's own temp folders are named in design-ci.json "temp.leftovers" and passed to sweepTemp as extra prefixes.
// msedge_url_fetcher_*, msedgeedge_BITS_* and Importer_* are Edge's (2026-10-15: 400 of them).
const LEFTOVERS = /^(visual-check-|edge-cmp-|edge-bt-|edge-|isolation-|iso-|portable-check-|merge-tags-|scoped_dir|msedge_chrome_Unpacker|HeadlessEdge|msedge_url_fetcher_|msedgeedge_BITS_|Importer_)/;
// Edge's extension downloads land in temp as <guid>.tmp files: a CRX package (starts "Cr24"), up to
// 73 MB each, never removed (10.9 GB by 2026-10-15). Matched by name AND content, so another
// program's <guid>.tmp is left alone.
const GUID_TMP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tmp$/i;
const isCrx = p => { let fd; try { fd = openSync(p, 'r'); const b = Buffer.alloc(4); readSync(fd, b, 0, 4, 0); return b.toString('latin1') === 'Cr24'; } catch { return false; } finally { if (fd !== undefined) closeSync(fd); } };
// Two hours: no check runs that long, so anything older is a leftover, never a browser in use.
export function sweepTemp(maxAgeHours = 2, extra = []) {
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const leftovers = extra.length ? new RegExp(`${LEFTOVERS.source}|^(${extra.map(esc).join('|')})`) : LEFTOVERS;
  const top = tmpdir(), cutoff = Date.now() - maxAgeHours * 3600000;
  let removed = 0;
  for (const name of readdirSync(top)) {
    const crx = GUID_TMP.test(name);
    if (!crx && !leftovers.test(name)) continue;
    const p = join(top, name);
    try {
      if (statSync(p).mtimeMs > cutoff || (crx && !isCrx(p))) continue;
      rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); removed++;
    } catch {}
  }
  return removed;
}

// The environment for a check browser: its own temp folder inside its profile. Edge writes its
// downloads (extension packages, url fetches) to the system temp folder whatever the launch flags
// say, and Edge 155's handed-off browser does too; with TEMP and TMP pointing into the profile they
// are deleted with it (closeBrowser, removeTemporaryDirectory). extra: more variables.
export function browserEnv(profile, extra = {}) {
  const temp = join(profile, 'tmp');
  mkdirSync(temp, { recursive: true });
  return { ...process.env, ...extra, TEMP: temp, TMP: temp };
}

// Close a browser started for a check and delete its profile. Ask it to close first (CDP
// Browser.close): a browser that is killed never deletes its own scoped_dir* folders, and its
// profile is still locked for a moment, so the folders were left behind on every run. Kill the
// whole tree only if it hasn't exited after a few seconds.
// Edge 155 (2026-10-14) hands its browser to a child and the launched process exits with 0 at once:
// the browser lives on, outside the launched process's tree. So close it through the protocol whether
// or not the launched process is alive, and then stop whatever still runs on this run's own profile
// (32 headless browsers had leaked that way).
export function killByProfile(profile) {
  if (!profile || process.platform !== 'win32') return;
  const p = profile.replace(/'/g, "''");
  spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${p}') } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }`], { stdio: 'ignore', windowsHide: true });
}
export async function closeBrowser(child, { send, ws, profile } = {}) {
  const exited = ms => child.exitCode !== null ? Promise.resolve() : new Promise(r => { child.once('exit', r); setTimeout(r, ms); });
  if (send) { try { await Promise.race([send('Browser.close'), new Promise(r => setTimeout(r, 2000))]); } catch {} await exited(5000); }
  try { ws?.close(); } catch {}
  if (child.exitCode === null) { killTree(child); await exited(3000); }
  killByProfile(profile);
  if (profile) try { rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }); } catch {}
}

// Launch flags for every check browser. Without them each headless Edge runs the component
// updater: it unpacks and installs a ~400 MB component into a scoped_dir* folder and an
// msedge_chrome_Unpacker* folder in temp on every launch, and keeps the profile busy while it does
// (10 GB in a day of reviews, 2026-10-11).
export const QUIET_FLAGS = ['--disable-component-update', '--disable-extensions', '--disable-background-networking',
  '--disable-default-apps', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--disable-crash-reporter',
  '--disable-breakpad', '--disable-features=msEdgeComponentUpdater,EdgeCollections,msUndersideButton'];

export const sleep = ms => new Promise(r => setTimeout(r, ms));
// A free port from the system, so parallel runs never share a browser.
export const freePort = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

// The Edge or Chrome already installed, in the order the check tools look for them.
export const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
];
export const findBrowser = () => BROWSERS.find(existsSync) || null;

// Start a disposable headless browser and connect to its first page over the debugging protocol.
// args: the tool's own flags. tries: how many 250 ms polls for the page target. timeoutMs: when set,
// every send() fails after that long instead of waiting for ever. port: a fixed debugging port
// (default: a free one). profilePrefix: the profile folder in temp is <prefix>-<port>.
// Throws when there is no browser or no page target (a browser that did start is killed first).
// Returns { browser, ws, send, port, profile }; close it with closeBrowser(browser, { send, ws, profile }).
export async function launchBrowser({ args = [], tries = 60, timeoutMs = 0, port, profilePrefix = 'edge-cmp' } = {}) {
  const path = findBrowser();
  if (!path) throw new Error('No Edge or Chrome found.');
  port = port || await freePort();
  const profile = join(tmpdir(), `${profilePrefix}-${port}`); rmSync(profile, { recursive: true, force: true });
  const browser = spawn(path, ['--headless=new', ...QUIET_FLAGS, ...(process.env.CI ? ['--no-sandbox'] : []), `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, ...args, 'about:blank'], { stdio: 'ignore', env: browserEnv(profile) });
  let target;
  for (let i = 0; i < tries && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  if (!target) { killTree(browser); throw new Error('The browser did not start.'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const k = ++id;
    const t = timeoutMs ? setTimeout(() => { pending.delete(k); rej(new Error(`${method} timed out after ${timeoutMs / 1000}s`)); }, timeoutMs) : null;
    pending.set(k, m => { clearTimeout(t); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); });
    ws.send(JSON.stringify({ id: k, method, params }));
  });
  return { browser, ws, send, port, profile };
}
