import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const insets = p => p.$eval('.hero__janela', e => (getComputedStyle(e).clipPath.match(/-?[\d.]+px/g) ?? []).map(parseFloat));
const videoJanela = p => p.$eval('.hero__janela video', v => {
  const m = new DOMMatrix(getComputedStyle(v).transform), r = v.getBoundingClientRect();
  return { escala: Math.hypot(m.a, m.b), w: v.offsetWidth, h: v.offsetHeight,
    cx: r.left + r.width / 2, cy: r.top + r.height / 2, direita: r.right, altura: r.height,
    borda: getComputedStyle(v).getPropertyValue('--borda').trim() };
});
const cardRef = p => p.$eval('.hero__card-ref', e => {
  const r = e.getBoundingClientRect(); return { w: r.width, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
});

test('desktop: hero-720 tocando', async () => {
  const { page } = await abrir(amb);
  await espera(800);
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-720.mp4') && !v.paused));
});

test('celular: hero-540', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  assert.ok(await page.$eval('.hero__video', v => v.currentSrc.endsWith('hero-540.mp4')));
});

test('topo: a janela tem o tamanho do card', async () => {
  const { page } = await abrir(amb);
  const [t, r, b, l] = await insets(page);
  assert.ok(t > 100 && r >= 0 && b > 100 && l > 900, JSON.stringify([t, r, b, l]));
});

test('fim do pin: a janela cobre a tela e a frase aparece', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#hero', 2.5 * 900 - 900);
  assert.ok((await insets(page)).slice(0, 4).every(v => Math.abs(v) < 1), JSON.stringify(await insets(page)));
  assert.ok(await page.$eval('.hero__abertura', e => +getComputedStyle(e).opacity > 0.9));
});

test('celular: card visível acima do letreiro, sem cobrir o texto da base', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  const { card, letreiro, base } = await page.evaluate(() => ({
    card: document.querySelector('.hero__card-ref').getBoundingClientRect().toJSON(),
    letreiro: document.querySelector('#hero .letreiro').getBoundingClientRect().toJSON(),
    base: document.querySelector('.hero__base').getBoundingClientRect().toJSON(),
  }));
  assert.ok(card.width > 60 && card.bottom <= letreiro.top && card.bottom <= base.top, JSON.stringify({ card, letreiro, base }));
});

test('leitor de tela ouve a frase da abertura uma vez só', async () => {
  const { page } = await abrir(amb);
  const arvore = await page.accessibility.snapshot({ interestingOnly: false });
  const textos = []; // só nós StaticText: o InlineTextBox filho repete o mesmo texto
  (function andar(n) { if (n.role === 'StaticText' && n.name) textos.push(n.name); (n.children ?? []).forEach(andar); })(arvore);
  assert.equal(textos.filter(t => t.includes('Um DJ de funk que explora as vertentes')).length, 1);
});

test('movimento reduzido: hero sem pin e frase visível na Carreira', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('#hero', e => e.getBoundingClientRect().height <= innerHeight + 1));
  assert.ok(await page.$eval('.carreira__abertura', e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).position !== 'absolute'));
});

test('letreiro com as 3 festas atuais', async () => {
  const { page } = await abrir(amb);
  const t = await page.$eval('#hero .letreiro', e => e.textContent);
  for (const f of ['Savage', 'Boiler Baile', 'Sonora Breck']) assert.ok(t.includes(f), f);
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

test('card do hero toca o reel novo antes do scroll', async () => {
  const { page } = await abrir(amb);
  const t = () => page.$eval('.hero__janela video', v => v.currentTime);
  const a = await t(); await espera(900);
  assert.ok(await t() > a, 'o vídeo do card avança sem scroll');
  assert.ok(await page.$eval('.hero__janela video', v => v.currentSrc.endsWith('janela-720.mp4')));
  assert.equal(await page.$('.hero__etiqueta'), null);
});

test('celular usa a janela de 540', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await espera(300);
  assert.ok(await page.$eval('.hero__janela video', v => v.currentSrc.endsWith('janela-540.mp4')));
});

test('autoplay recusado no card: pôster fica e nenhum erro', async () => {
  const { page, erros } = await abrir(amb, { antes: p => p.evaluateOnNewDocument(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('bloqueado', 'NotAllowedError')); }) });
  await espera(500);
  assert.ok(await page.$eval('.hero__janela video', v => v.poster.endsWith('janela-720.jpg')));
  assert.deepEqual(erros, []);
  // a caixa do vídeo vem do CSS (aspect-ratio), não dos metadados: o pôster preenche o card certinho
  const v = await videoJanela(page), c = await cardRef(page);
  assert.ok(Math.abs(v.escala * v.w - c.w) < 1, JSON.stringify({ v, c }));
});

test('movimento reduzido: card parado no pôster', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  await espera(500);
  assert.ok(await page.$eval('.hero__janela video', v => v.paused));
});

test('janela: trecho de 10 s do começo do reel', async () => {
  const { page } = await abrir(amb);
  await page.waitForFunction(() => document.querySelector('.hero__janela video').readyState >= 1);
  const d = await page.$eval('.hero__janela video', v => v.duration);
  assert.ok(Math.abs(d - 10) < 0.3, String(d));
});

test('topo: o card mostra o vídeo inteiro', async () => {
  const { page } = await abrir(amb);
  const v = await videoJanela(page), c = await cardRef(page);
  assert.ok(Math.abs(v.escala * v.w - c.w) < 1, JSON.stringify({ v, c }));
  assert.ok(Math.hypot(v.cx - c.cx, v.cy - c.cy) < 2, JSON.stringify({ v, c }));
  assert.equal(v.borda, '0%');
});

test('fim do pin: vídeo inteiro com a altura da tela, encostado à direita', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#hero', 2.5 * 900 - 900);
  const v = await videoJanela(page);
  assert.ok(Math.abs(v.altura - 900) < 1 && Math.abs(v.direita - 1440) < 1 && Math.abs(v.w - 506.25) < 1, JSON.stringify(v));
  assert.equal(v.borda, '14%');
});

test('celular, fim do pin: vídeo centralizado com a altura da tela', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#hero', 2.5 * 844 - 844);
  const v = await videoJanela(page);
  // 9:16 com a altura da tela é mais largo que o celular: centralizado, corta só as laterais
  assert.ok(Math.abs(v.altura - 844) < 1 && Math.abs(v.cx - 195) < 1 && Math.abs(v.w - 474.75) < 1, JSON.stringify(v));
});

test('girar no fim do pin: o vídeo recalcula', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#hero', 2.5 * 900 - 900);
  await page.setViewport({ width: 900, height: 1200 });
  await espera(1500);
  const v = await videoJanela(page);
  assert.ok(Math.abs(v.altura - 1200) < 1 && Math.abs(v.direita - 900) < 1 && Math.abs(v.w - 675) < 1, JSON.stringify(v));
});
