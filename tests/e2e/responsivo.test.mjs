import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); mkdirSync('tests/e2e/telas', { recursive: true }); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const SECOES = ['#hero', '#carreira', '#numeros', '#producoes', '#sets', '#lineup', '#assinatura', '#contrate'];

for (const [largura, altura] of [[390, 844], [1440, 900]]) {
  test(`varredura ${largura}px: sem rolagem horizontal e sem erros`, async () => {
    const { page, erros } = await abrir(amb, { largura, altura });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(altura * 0.8)) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await espera(120);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `y=${y}`);
    }
    assert.deepEqual(erros, []);
  });

  test(`telas ${largura}px`, async () => {
    const { page } = await abrir(amb, { largura, altura });
    for (const s of SECOES) {
      await rolarPara(page, s, s === '#assinatura' ? altura : 0);
      await espera(500);
      await page.screenshot({ path: `tests/e2e/telas/${largura}-${s.slice(1)}.png` });
    }
  });
}

test('movimento reduzido: página inteira sem erros e vídeos parados', async () => {
  const { page, erros } = await abrir(amb, { menosMovimento: true });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await espera(500);
  assert.ok(await page.$$eval('video', l => l.every(v => v.paused)));
  assert.deepEqual(erros, []);
});
