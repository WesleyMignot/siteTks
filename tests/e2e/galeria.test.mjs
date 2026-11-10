import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const transformDoPrimeiro = p => p.$eval('#galeria .galeria__item', e => e.style.transform);
const quantos = p => p.$$eval('#galeria .galeria__item', l => l.length);

test('desktop: 15 itens que se movem sozinhos', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#galeria', 200);
  assert.equal(await quantos(page), 15);
  const t1 = await transformDoPrimeiro(page);
  await espera(500);
  assert.notEqual(t1, await transformDoPrimeiro(page));
});

test('celular: 10 itens', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#galeria', 200);
  assert.equal(await quantos(page), 10);
});

test('hover mostra a cor', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#galeria', 200);
  const temCor = await page.$eval('#galeria .galeria__item:has(img.cor)', e => {
    e.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    return e.classList.contains('foto-dupla--cor');
  });
  assert.ok(temCor);
});

test('movimento reduzido: grade estática', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('#galeria', e => e.classList.contains('galeria--estatica')));
  assert.equal(await transformDoPrimeiro(page), '');
});

test('redimensionar 1440 → 390 refaz a galeria sem rolagem horizontal', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#galeria', 200);
  await page.setViewport({ width: 390, height: 844 });
  await espera(800);
  assert.equal(await quantos(page), 10);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
