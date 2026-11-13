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
    const tela = async nome => { await espera(500); await page.screenshot({ path: `tests/e2e/telas/${largura}-${nome}.png` }); };
    for (const s of SECOES) {
      await rolarPara(page, s, s === '#assinatura' ? 2.5 * altura : 0); // assinatura (350vh): estado final (P = 1)
      await tela(s.slice(1));
    }
    // extras: hero no meio do pin; faixa da virada para os Sets; assinatura na chegada (P 0,25) e formando (P 0,7)
    // (P vai do topo da assinatura no fundo da tela até o fim da seção: deslocamento = 3,5·altura·P − altura)
    const assinatura = P => Math.round(3.5 * altura * P - altura);
    await rolarPara(page, '#hero', Math.round(0.4 * 1.5 * altura)); await tela('hero-0.4');
    await rolarPara(page, '#sets', -Math.round(altura / 2)); await tela('virada-sets');
    await rolarPara(page, '#assinatura', assinatura(0.25)); await tela('assinatura-0.25');
    await rolarPara(page, '#assinatura', assinatura(0.7)); await tela('assinatura-0.7');
  });
}

test('movimento reduzido: página inteira sem erros e vídeos parados', async () => {
  const { page, erros } = await abrir(amb, { menosMovimento: true });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await espera(500);
  assert.ok(await page.$$eval('video', l => l.every(v => v.paused)));
  assert.deepEqual(erros, []);
});
