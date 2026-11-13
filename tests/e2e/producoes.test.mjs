import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));

test('3 produções na ordem, com os papéis', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.producao__nome', l => l.map(e => e.textContent.trim())),
    ['Savage', 'Boiler Baile', 'Sonora Breck']);
  const papeis = await page.$$eval('.producao__papel', l => l.map(e => e.textContent));
  assert.ok(papeis[0].includes('Fundador') && papeis.slice(1).every(p => p.includes('Cofundador')));
});

const opac = (p, i) => p.$$eval('.producao__fundo', (l, i) => +getComputedStyle(l[i]).opacity, i);

test('desktop: a foto da faixa acende no hover', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 300);
  assert.ok(await opac(page, 1) < 0.3);
  await (await page.$$('.producao'))[1].hover();
  await espera(700);
  assert.ok(await opac(page, 1) > 0.9);
  assert.equal(await page.$('.producoes__flutuante'), null);
});

test('celular: a faixa no centro da tela acende', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await page.evaluate(() => { const l = document.querySelectorAll('.producao')[2]; const r = l.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); });
  await espera(700);
  assert.ok(await page.$$eval('.producao', l => l[2].classList.contains('producao--acesa')));
});

test('celular: abrir uma faixa não desalinha o acender das outras', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#producoes');
  await page.click('.producao:first-child .producao__botao');
  await espera(300);
  await page.evaluate(() => { const l = document.querySelectorAll('.producao')[2]; const r = l.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); });
  await espera(700);
  assert.deepEqual(await page.$$eval('.producao', l => l.map(e => e.classList.contains('producao--acesa'))),
    [false, false, true]);
});

test('fotos de fundo das faixas', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.producao__fundo', l => l.map(e => [e.getAttribute('aria-hidden'), e.style.backgroundImage.match(/[\w-]+\.webp/)?.[0]])),
    [['true', 'producao-savage.webp'], ['true', 'producao-boiler.webp'], ['true', 'producao-sonora.webp']]);
});

test('celular: toque abre e fecha', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  const b = '.producao:first-child .producao__botao';
  await rolarPara(page, '#producoes');
  await page.click(b);
  assert.equal(await page.$eval(b, e => e.getAttribute('aria-expanded')), 'true');
  await page.click(b);
  assert.equal(await page.$eval(b, e => e.getAttribute('aria-expanded')), 'false');
});
