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
  assert.ok(await page.$$eval('#hero .div-morcego', l => l.length >= 4 && l.every(d => d.querySelector('svg .morcego__forma'))));
});

test('divisores batem as asas (o desenho muda com o tempo)', async () => {
  // só os visíveis animam: compara todos os do hero (o 1º pode já ter saído da tela no letreiro)
  const { page } = await abrir(amb);
  const d = () => page.$$eval('#hero .div-morcego path', l => l.map(p => p.getAttribute('d')));
  const a = await d(); await new Promise(r => setTimeout(r, 250));
  const b = await d();
  assert.ok(b.some((x, i) => x !== a[i]));
});

test('movimento reduzido: divisores parados', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  const d = () => page.$$eval('#hero .div-morcego path', l => l.map(p => p.getAttribute('d')));
  const a = await d(); await new Promise(r => setTimeout(r, 250));
  assert.deepEqual(await d(), a);
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

test('céu: faixa cheia na virada para os Sets', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#sets', -450); await new Promise(r => setTimeout(r, 300));
  assert.ok(await page.$eval('.ceu', c => +c.dataset.desenhados) >= 100);
});

test('céu no celular: faixa menor, sem rolagem lateral e DPR no máximo 2', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await new Promise(r => setTimeout(r, 400));
  await rolarPara(page, '#sets', -420); await new Promise(r => setTimeout(r, 300));
  const r = await page.$eval('.ceu', c => ({ n: +c.dataset.desenhados, w: c.width, iw: innerWidth }));
  assert.ok(r.n > 0 && r.n <= 95 && r.w <= 2 * r.iw, JSON.stringify(r));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('céu vazio quando nenhuma cena está ativa (pular pelo menu até o Contrate)', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2600));
  assert.equal(await page.$eval('.ceu', c => +c.dataset.desenhados), 0);
});

test('céu acompanha a caixa real (barra de rolagem clássica não espreme os morcegos)', async () => {
  // o puppeteer esconde as barras: simula uma de 15 px estreitando a caixa do canvas
  const { page } = await abrir(amb);
  const r = await page.evaluate(async () => {
    const c = document.querySelector('.ceu');
    c.style.width = 'calc(100% - 15px)';
    dispatchEvent(new Event('resize'));
    await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)));
    return { w: c.width, caixa: c.clientWidth, dpr: Math.min(2, devicePixelRatio || 1) };
  });
  assert.equal(r.w, Math.round(r.caixa * r.dpr), JSON.stringify(r));
});

test('movimento reduzido: sem céu', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.ok(await page.$eval('.ceu', c => getComputedStyle(c).display === 'none'));
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

test('Sinistro DNB só na biografia; o número de festas continua 4', async () => {
  const { page } = await abrir(amb);
  const tem = sel => page.$eval(sel, e => e.textContent.includes('Sinistro'));
  assert.equal(await tem('#hero .letreiro'), false);
  assert.equal(await tem('#producoes'), false);
  assert.equal(await tem('#carreira'), true);
  assert.ok(!(await page.$eval('meta[name=description]', m => m.content)).includes('Sinistro'));
  assert.ok(await page.$$eval('[data-contar]', l => l.some(e => e.dataset.contar === '4' && e.parentElement.textContent.includes('festas criadas'))));
});

test('Produções em tela de toque larga acendem no centro da tela', async () => {
  const { page } = await abrir(amb, { largura: 1180, altura: 820, antes: p => p.evaluateOnNewDocument(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = q => (q.includes('hover: none') ? mm('(min-width: 0px)') : mm(q)); }) });
  await page.evaluate(() => { const l = document.querySelectorAll('.producao')[1], r = l.getBoundingClientRect();
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); });
  await new Promise(r => setTimeout(r, 700));
  assert.ok(await page.$$eval('.producao', l => l[1].classList.contains('producao--acesa')));
});

test('movimento reduzido: foto das Produções sem zoom', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  assert.equal(await page.$eval('.producao__fundo', e => getComputedStyle(e).transform), 'none');
});
