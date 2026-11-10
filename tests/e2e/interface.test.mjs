import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const expandido = p => p.$eval('#menu-botao', b => b.getAttribute('aria-expanded'));

test('preloader some', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('#preloader', e => getComputedStyle(e).display), 'none');
});

test('relógio de POA', async () => {
  const { page } = await abrir(amb);
  assert.match(await page.$eval('.relogio', e => e.textContent.replace(/\s+/g, ' ').trim()), /^POA \d{2}:\d{2}$/);
});

test('menu abre, foca e fecha com Esc', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao');
  assert.equal(await expandido(page), 'true');
  assert.ok(await page.evaluate(() => document.getElementById('menu').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  assert.equal(await expandido(page), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-botao');
});

test('link do menu chega ao Contrate atravessando as seções fixas', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao');
  await page.click('#menu a[href="#contrate"]');
  await espera(2500);
  const topo = await page.$eval('#contrate', e => e.getBoundingClientRect().top);
  assert.ok(topo > -5 && topo < 100, String(topo));
});

test('Google Fonts bloqueado: a página abre mesmo assim', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/fonts\.(googleapis|gstatic)\.com/] });
  assert.ok(await page.$eval('body', b => b.classList.contains('pronto')));
  assert.deepEqual(erros, []);
});
