// Rodada 2: identidade nova, morcegos (divisores e revoadas) e varredura.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });

test('fontes novas: títulos em Pirata One, texto em Space Mono', async () => {
  const { page } = await abrir(amb);
  assert.match(await page.$eval('#t-producoes', e => getComputedStyle(e).fontFamily), /Pirata One/);
  assert.match(await page.$eval('body', e => getComputedStyle(e).fontFamily), /Space Mono/);
});

test('vermelho novo nas seções vermelhas', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('#carreira', e => getComputedStyle(e).backgroundColor), 'rgb(232, 57, 47)');
});

test('header fica escuro sobre a seção creme das Produções', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 120);
  assert.ok(await page.$eval('header', h => h.classList.contains('header--escuro')));
});

test('divisores do letreiro do hero são morcegos', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$$eval('#hero .div-morcego', l => l.length >= 4 && l.every(d => d.querySelector('svg .morcego__asas'))));
});

test('sem JS os divisores mostram ✦', async () => {
  const { page } = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.equal(await page.$eval('#hero .div-morcego', d => d.textContent.trim()), '✦');
});

test('menu com 5 seções numeradas', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('#menu .menu__links a', l => l.map(a => a.getAttribute('href'))),
    ['#carreira', '#producoes', '#sets', '#lineup', '#contrate']);
});
