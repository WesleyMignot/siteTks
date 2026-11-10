import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const display = (p, s) => p.$eval(s, e => getComputedStyle(e).display);

test('desktop: hero-720 tocando e card visível', async () => {
  const { page } = await abrir(amb);
  await espera(800);
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-720.mp4') && !v.paused));
  assert.notEqual(await display(page, '.hero__card'), 'none');
});

test('celular: hero-540 e sem card', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-540.mp4')));
  assert.equal(await display(page, '.hero__card'), 'none');
});

test('letreiro com as 4 festas', async () => {
  const { page } = await abrir(amb);
  const t = await page.$eval('#hero .letreiro', e => e.textContent);
  for (const f of ['Savage', 'Boiler Baile', 'Sonora Breck', 'Sinistro DNB']) assert.ok(t.includes(f), f);
});

test('logo quebrado vira texto', async () => {
  const { page } = await abrir(amb, { bloquear: [/logo-sticker-osso\.png/] });
  assert.equal(await page.$eval('#hero .logo-texto', e => e.hidden), false);
});

test('autoplay recusado não gera erro', async () => {
  const { page, erros } = await abrir(amb, {
    antes: p => p.evaluateOnNewDocument(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('x', 'NotAllowedError'));
    }),
  });
  await espera(500);
  assert.deepEqual(erros, []);
  assert.ok(await page.$eval('.hero__video', v => v.poster.endsWith('hero.jpg')));
});
