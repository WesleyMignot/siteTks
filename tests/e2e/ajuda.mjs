// Ambiente de teste e2e: servidor estático da raiz do repo + Chrome via puppeteer-core.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.json': 'application/json',
};

function servidor() {
  const srv = http.createServer(async (req, res) => {
    try {
      const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      const arquivo = join(RAIZ, caminho);
      if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
      const info = await stat(arquivo);
      if (!info.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(arquivo).toLowerCase()] ?? 'application/octet-stream' });
      res.end(await readFile(arquivo));
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

export async function iniciarAmbiente() {
  const srv = await servidor();
  const url = `http://127.0.0.1:${srv.address().port}`;
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  return {
    url, browser,
    fechar: async () => { await browser.close(); await new Promise(ok => srv.close(ok)); },
  };
}

export async function abrir(amb, {
  largura = 1440, altura = 900, menosMovimento = false, bloquear = [], atrasar = [], antes,
  esperarPronto = true, semJs = false,
} = {}) {
  const page = await amb.browser.newPage();
  const erros = [];
  await page.setViewport({ width: largura, height: altura });
  if (menosMovimento) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (semJs) await page.setJavaScriptEnabled(false);
  const bloqueada = u => bloquear.some(re => re.test(u));
  if (bloquear.length || atrasar.length) {
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (bloqueada(r.url())) { r.abort(); return; }
      const atraso = atrasar.find(a => a.re.test(r.url()));
      if (atraso) setTimeout(() => r.continue().catch(() => {}), atraso.ms);
      else r.continue();
    });
  }
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const u = m.location()?.url ?? '';
    if (bloqueada(u) || /net::ERR_FAILED|ERR_BLOCKED_BY_CLIENT/.test(m.text()) && bloquear.length) return;
    erros.push(`console: ${m.text()} ${u}`);
  });
  page.on('pageerror', e => erros.push(`pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400 && !bloqueada(r.url())) erros.push(`${r.status()} ${r.url()}`); });
  if (antes) await antes(page);
  await page.goto(`${amb.url}/index.html`, { waitUntil: 'domcontentloaded' });
  if (esperarPronto) await page.waitForFunction(() => document.body?.classList.contains('pronto'), { timeout: 10_000 });
  return { page, erros };
}

const espera = ms => new Promise(r => setTimeout(r, ms));

export async function rolarPara(page, seletor, deslocamento = 0) {
  await page.evaluate((s, d) => {
    const el = document.querySelector(s);
    const topo = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, topo + d);
  }, seletor, deslocamento);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await espera(400);
}
