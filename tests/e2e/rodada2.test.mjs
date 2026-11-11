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

test('pular pelo menu do topo ao Contrate deixa tudo no estado final coerente', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2600));
  const topo = await page.$eval('#contrate', e => e.getBoundingClientRect().top);
  assert.ok(topo > -5 && topo < 100);
  await page.click('#menu-botao'); await page.click('#menu a[href="#carreira"]');
  await new Promise(r => setTimeout(r, 2600));
  const ins = await page.$eval('.hero__janela', e => (getComputedStyle(e).clipPath.match(/-?[\d.]+px/g) ?? []).map(parseFloat));
  assert.ok(ins.slice(0, 4).every(v => Math.abs(v) < 1)); // passou do hero: janela aberta
});

// Fração de pixels de uma linha da tela que destoam da cor de fundo `bg` (soma das diferenças RGB > 80).
async function fracaoTinta(page, y, bg) {
  const b64 = await page.screenshot({ encoding: 'base64', clip: { x: 0, y, width: 1440, height: 1 } });
  return page.evaluate(async (src, bg) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = 1;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, 1).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 80) n++;
    return n / c.width;
  }, b64, bg);
}

test('faixa de chamas cobre a emenda e some suave embaixo (inclusive as viradas)', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  for (const id of ['#sets', '#contrate', '#lineup']) {
    await rolarPara(page, id, -400);
    const bg = await page.$eval(id, e => getComputedStyle(e).backgroundColor.match(/\d+/g).slice(0, 3).map(Number));
    const topo = await page.$eval(id, e => Math.round(e.getBoundingClientRect().top + scrollY)); // clip do screenshot é em coordenadas do documento
    const naEmenda = await fracaoTinta(page, topo + 6, bg);
    const noFim = await fracaoTinta(page, topo + 96, bg);
    assert.ok(naEmenda > 0.08 && noFim < 0.03, `${id}: emenda ${naEmenda.toFixed(3)}, fim ${noFim.toFixed(3)}`);
  }
});

test('texturas de chamas emendam sem corte quando se repetem na horizontal', async () => {
  const { page } = await abrir(amb);
  const r = await page.evaluate(async () => {
    const out = {};
    for (const n of ['preto-no-vermelho', 'vermelho-no-preto', 'creme-no-preto', 'vermelho-no-creme']) {
      const img = new Image(); img.src = `assets/texturas/${n}.webp`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const a = g.getImageData(0, 0, 1, c.height).data, b = g.getImageData(c.width - 1, 0, 1, c.height).data;
      let ruins = 0;
      for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 120) ruins++;
      out[n] = ruins / c.height;
    }
    return out;
  });
  assert.ok(Object.values(r).every(f => f < 0.05), JSON.stringify(r));
});
