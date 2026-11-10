import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });

test('carrega sem erros, com as seções na ordem', async () => {
  const { page, erros } = await abrir(amb);
  assert.deepEqual(await page.$$eval('main > section', s => s.map(e => e.id)),
    ['hero', 'carreira', 'numeros', 'galeria', 'producoes', 'sets', 'lineup', 'assinatura', 'contrate']);
  assert.equal(await page.$eval('html', h => h.lang), 'pt-BR');
  assert.equal(await page.evaluate(() => typeof gsap + typeof ScrollTrigger + typeof Lenis), 'objectfunctionfunction');
  assert.equal(await page.$eval('html', h => h.dataset.lenis), 'on');
  assert.deepEqual(erros, []);
});

test('movimento reduzido: sem Lenis', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('html', h => h.classList.contains('menos-movimento') && h.dataset.lenis), 'off');
});
