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

test('revoada cruza a tela na virada para os Sets', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#sets', -450);
  await new Promise(r => setTimeout(r, 300));
  assert.ok(await page.$$eval('#sets .revoada svg', l => l.length >= 6 && l.some(s => {
    const r = s.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight; })));
});

test('revoada: celular com menos morcegos e sem rolagem lateral', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#sets', -420);
  assert.ok(await page.$$eval('#sets .revoada svg', l => l.length >= 3 && l.length <= 5));
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('.revoada')].every(r => getComputedStyle(r).overflow === 'hidden')));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('revoada da virada para as Produções aparece acima da seção (não é cortada)', async () => {
  const { page } = await abrir(amb);
  const corte = await page.$eval('#producoes', s => getComputedStyle(s).overflowY);
  assert.equal(corte, 'visible');
  assert.equal(await page.$$eval('[data-revoada]', l => l.map(r => r.closest('section').id).join()), 'producoes,sets,assinatura');
});

test('revoada contrasta com os dois lados da virada', async () => {
  const { page } = await abrir(amb);
  const r = await page.$$eval('[data-revoada]', l => l.map(rv => {
    const fundo = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; } return 'rgb(255, 255, 255)'; };
    const secao = rv.closest('section');
    return { id: secao.id, cor: getComputedStyle(rv).color, aqui: fundo(secao), antes: fundo(secao.previousElementSibling) };
  }));
  for (const x of r) assert.ok(x.cor !== x.aqui && x.cor !== x.antes, JSON.stringify(x));
});

test('movimento reduzido: sem revoadas', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$$eval('.revoada svg', l => l.length), 0);
});
