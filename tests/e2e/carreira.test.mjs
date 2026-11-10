import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const valores = p => p.$$eval('#numeros .numero__valor', l => l.map(e => e.textContent.trim()));

test('bio completa', async () => {
  const { page } = await abrir(amb);
  const t = await page.$eval('#carreira', e => e.textContent);
  for (const s of ['ativo desde 2017', 'Planeta Atlântida por três edições', 'na França e na Espanha', 'fundador da Savage'])
    assert.ok(t.includes(s), s);
});

test('contadores chegam ao valor final', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#numeros');
  await espera(2200);
  assert.deepEqual(await valores(page), ['288 mil+', '2017', '3×', '2.000+', '4', 'FR · ES']);
});

test('movimento reduzido: valores finais sem animar', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('#numeros .numero__valor', e => e.textContent.trim()), '288 mil+');
});
