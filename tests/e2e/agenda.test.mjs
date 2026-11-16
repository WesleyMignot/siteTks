// Agenda (rodada 5): o bloco vem do robô (tools/agenda.mjs) e muda com o tempo. Por isso o relógio da página é sempre
// simulado a partir das datas que estão no index.html em disco, nunca o relógio real.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iniciarAmbiente, abrir } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const bloco = html.slice(html.indexOf('<!-- agenda:inicio -->'), html.indexOf('<!-- agenda:fim -->'));
const FINS = [...bloco.matchAll(/<article class="evento" data-fim="([^"]+)"/g)].map(m => Date.parse(m[1]));
const INICIOS = [...bloco.matchAll(/<time datetime="([^"]+)"/g)].map(m => Date.parse(m[1]));
const DIA = 24 * 3600_000;
const semCartoes = FINS.length ? false : 'index.html sem eventos na agenda agora';

/** Desloca Date e Date.now da página em `desvio` ms (o relógio continua andando). Roda dentro da página. */
function adiantarRelogio(desvio) {
  const D = Date;
  const agora = () => D.now() + desvio;
  globalThis.Date = class extends D {
    constructor(...a) { if (a.length) super(...a); else super(agora()); }
    static now() { return agora(); }
  };
}
const abrirEm = (alvo, opcoes = {}) =>
  abrir(amb, { ...opcoes, antes: p => p.evaluateOnNewDocument(adiantarRelogio, alvo - Date.now()) });
const estado = page => page.evaluate(() => ({
  visiveis: [...document.querySelectorAll('.evento')].map(e => !e.hidden && e.getClientRects().length > 0),
  vazia: !document.querySelector('.agenda__vazia').hidden,
}));

test('cartões aparecem antes do primeiro show', { skip: semCartoes }, async () => {
  const { page, erros } = await abrirEm(Math.min(...INICIOS) - DIA);
  const e = await estado(page);
  assert.equal(e.visiveis.length, FINS.length);
  assert.ok(e.visiveis.every(Boolean));
  assert.equal(e.vazia, false);
  assert.ok(await page.$$eval('.evento__link', l => l.length > 0 && l.every(a => a.target === '_blank' && a.rel.includes('noopener'))));
  assert.deepEqual(erros, []);
});

test('show que passou some', { skip: semCartoes }, async () => {
  const alvo = FINS[0] + 60_000;
  const { page } = await abrirEm(alvo);
  const e = await estado(page);
  assert.deepEqual(e.visiveis, FINS.map(f => f >= alvo));
  assert.equal(e.vazia, FINS.every(f => f < alvo));
});

test('todos passados: agenda aberta', async () => {
  const { page } = await abrirEm(Math.max(Date.now(), ...FINS) + DIA);
  const e = await estado(page);
  assert.ok(e.visiveis.every(v => !v));
  assert.equal(e.vazia, true);
  assert.equal(await page.$eval('.agenda__vazia a.botao', a => a.getAttribute('href')), '#contrate');
  assert.match(await page.$eval('.agenda__vazia', d => d.textContent), /Agenda aberta/);
});

test('agenda em 320 px sem rolagem lateral da página', { skip: semCartoes }, async () => {
  const { page } = await abrirEm(Math.min(...INICIOS) - DIA, { largura: 320, altura: 640 });
  const r = await page.evaluate(() => {
    const c = document.querySelector('.agenda__cartoes');
    return { pagina: document.documentElement.scrollWidth, tela: innerWidth, rola: c.scrollWidth > c.clientWidth };
  });
  assert.ok(r.pagina <= r.tela, `${r.pagina} > ${r.tela}`);
  if (FINS.length > 1) assert.ok(r.rola, 'o carrossel rola por dentro');
});

test('sem JS a agenda aparece como veio do robô', async () => {
  const { page } = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.equal(await page.$$eval('.evento', l => l.filter(e => !e.hidden).length), FINS.length);
  assert.equal(await page.$eval('.agenda__vazia', d => d.hidden), FINS.length > 0);
});
