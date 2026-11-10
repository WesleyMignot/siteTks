import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));

const SETS = [
  ['Senso Rádio convida Brunin', 'https://www.youtube.com/watch?v=5ackC9W3BIs'],
  ['Boiler Baile x Grau', 'https://www.youtube.com/watch?v=2Z2gP9W9Epo'],
  ['Boiler Baile Ataque Sonoro', 'https://www.youtube.com/watch?v=PuYyCp85V9U'],
  ['Veneno Lab', 'https://www.youtube.com/watch?v=SLUUZG8-oYA'],
  ['Live Sensi por BSTV', 'https://www.youtube.com/watch?v=IP9V-06-QJw'],
  ['Rewind BR', 'https://soundcloud.com/functionfm/brunin-tks-rewind-br-04-functionfm-18102025'],
  ['Trinka', 'https://soundcloud.com/trinkabr/tkm11-brunin-tks'],
  ['Modelo Brasileño', 'https://radiorelativa.eu/episode/modelo-brasileno-2'],
];

test('8 sets com os links certos', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set', l => l.map(s => [
    s.querySelector('.set__titulo').textContent.trim(),
    s.querySelector('.set__link').getAttribute('href'),
  ])), SETS);
  assert.ok(await page.$$eval('.set__link', l => l.every(a => a.target === '_blank' && a.rel.includes('noopener'))));
});

test('vídeos dos sets não pré-carregam', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$$eval('.set__video', l => l.every(v => v.preload === 'none' && !v.getAttribute('src'))));
});

test('só o set ativo toca', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60);
  await espera(900);
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  assert.deepEqual(await page.$$eval('.set__video', l => l.map(v => !v.paused)),
    [false, false, true, false, false, false, false, false]);
});

test('destaque do Aquele Tuim', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$eval('.destaques', e => [...e.querySelectorAll('a')].some(a =>
    a.href === 'https://www.aqueletuim.com.br/2024/11/os-melhores-dj-sets-de-funk-de-2024.html')));
});

test('vídeos dos sets: 5 do YouTube + 3 do reel em sets/', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set__video', l => l.map(v => v.dataset.src)),
    ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'maos', 'pista', 'cabine'].map(n => `assets/video/sets/${n}.mp4`));
});

test('clipe que não carrega não quebra a pilha', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/sets\/ataque\.mp4/] });
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60);
  await espera(900);
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  assert.ok(await page.$eval('.set:nth-child(3) .set__video', v => v.poster.endsWith('sets/ataque.jpg')));
  assert.deepEqual(erros, []);
});
