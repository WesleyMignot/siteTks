import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));

test('4 produções na ordem, com os papéis', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.producao__nome', l => l.map(e => e.textContent.trim())),
    ['Savage', 'Boiler Baile', 'Sonora Breck', 'Sinistro DNB']);
  const papeis = await page.$$eval('.producao__papel', l => l.map(e => e.textContent));
  assert.ok(papeis[0].includes('Fundador') && papeis.slice(1).every(p => p.includes('Cofundador')));
});

test('desktop: foto segue o cursor', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#producoes', 200);
  const linha = (await page.$$('.producao'))[1];
  await linha.hover();
  await espera(400);
  assert.ok(await page.$eval('.producoes__flutuante', e => +getComputedStyle(e).opacity > 0.5 && e.src.includes('boiler')));
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
