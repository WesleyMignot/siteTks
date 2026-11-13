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
  ['Modelo Brasileño', 'https://radiorelativa.eu/episode/modelo-brasileno-2'],
  ['Rewind BR', 'https://soundcloud.com/functionfm/brunin-tks-rewind-br-04-functionfm-18102025'],
  ['Trinka', 'https://soundcloud.com/trinkabr/tkm11-brunin-tks'],
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

test('vídeos dos sets: 5 do YouTube + 3 reels do Instagram em sets/', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set__video', l => l.map(v => v.dataset.src)),
    ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'reel-a', 'reel-b', 'reel-c'].map(n => `assets/video/sets/${n}.mp4`));
});

test('clipe com requisição abortada não quebra a pilha', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/sets\/ataque\.mp4/] });
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60);
  await espera(900);
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  assert.ok(await page.$eval('.set:nth-child(3) .set__video', v => v.poster.endsWith('sets/ataque.jpg')));
  assert.deepEqual(erros, []);
});

test('Ouvir aqui: só nos sets do SoundCloud, escondido sem JS', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.set', l => l.map(s => !!s.querySelector('.set__ouvir:not([hidden])'))),
    [false, false, false, false, false, false, true, true]);
  const semJs = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.ok(await semJs.page.$$eval('.set__ouvir', l => l.length === 2 && l.every(b => b.hidden)));
});

test('clicar em Ouvir aqui troca o botão pelo player do SoundCloud (SoundCloud bloqueado: sem erro)', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/soundcloud\.com/] });
  await page.$eval('.set:nth-child(8) .set__ouvir', b => b.click());
  const f = await page.$eval('.set:nth-child(8) iframe.set__player', i => ({ src: i.src, title: i.title }));
  assert.ok(f.src.startsWith('https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Ftrinkabr'), f.src);
  assert.match(f.title, /SoundCloud.*Trinka/);
  assert.equal(await page.$('.set:nth-child(8) .set__ouvir'), null);
  assert.equal(await page.$$eval('.set:nth-child(8) iframe', l => l.length), 1);
  assert.ok(await page.$eval('.set:nth-child(8) .set__link', a => a.href.includes('soundcloud.com/trinkabr')));
  await espera(500);
  assert.deepEqual(erros, []);
});

test('focar o Ouvir aqui pelo teclado leva ao set dele', async () => {
  const { page } = await abrir(amb);
  await page.focus('.set:nth-child(7) .set__ouvir');
  await espera(1500);
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '07 / 08');
});
