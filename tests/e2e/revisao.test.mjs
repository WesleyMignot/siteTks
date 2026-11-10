// Achados da revisão final: cada teste reproduz um problema real de visitante.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const estiloPreloader = p => p.$eval('#preloader', e => {
  const s = getComputedStyle(e); return { display: s.display, visibility: s.visibility };
});

// #1 — falha de JS não pode deixar a tela preta
test('CDN do GSAP fora do ar: a página abre no modo estático', async () => {
  const { page, erros } = await abrir(amb, { bloquear: [/cdnjs\.cloudflare\.com/] });
  assert.equal((await estiloPreloader(page)).display, 'none');
  assert.ok(await page.$eval('#galeria', e => e.classList.contains('galeria--estatica')));
  assert.deepEqual(erros, []);
});

test('JS desligado: o preloader não cobre a página', async () => {
  const { page } = await abrir(amb, { semJs: true, esperarPronto: false });
  await espera(300);
  assert.equal((await estiloPreloader(page)).display, 'none');
});

test('main.js não carrega: o preloader some sozinho', async () => {
  const { page } = await abrir(amb, { bloquear: [/js\/main\.js/], esperarPronto: false });
  await espera(9500);
  assert.equal((await estiloPreloader(page)).visibility, 'hidden');
});

// #2 — Google Fonts lento não pode travar a página
test('Google Fonts lento (12 s): a página fica pronta em menos de 8 s', async () => {
  const t0 = Date.now();
  await abrir(amb, { atrasar: [{ re: /fonts\.googleapis\.com/, ms: 12_000 }] });
  assert.ok(Date.now() - t0 < 8000, `${Date.now() - t0} ms`);
});

// #3 — foco do menu para quem usa teclado
test('menu aberto: Tab não sai para o conteúdo escondido atrás', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('main, footer')), false, `tab ${i + 1}`);
  }
});

test('menu pelo teclado: depois de ir ao Contrate, o próximo Tab continua no Contrate', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao');
  await page.focus('#menu a[href="#contrate"]');
  await page.keyboard.press('Enter');
  await espera(2500);
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => !!document.activeElement.closest('#contrate')));
});

// #4 — movimento reduzido não pode esconder nomes do line-up
test('movimento reduzido: todos os nomes do line-up cabem na tela', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  const { direitas, largura } = await page.evaluate(() => ({
    direitas: [...document.querySelectorAll('#lineup .letreiro__trilho > span:not([aria-hidden])')]
      .map(s => s.getBoundingClientRect().right),
    largura: innerWidth,
  }));
  assert.ok(direitas.length === 2 && direitas.every(r => r <= largura + 1), JSON.stringify(direitas));
});

// #5 — Produções acompanha a mudança de largura (iPad girando)
test('Produções: girar de 820 (retrato) para 1180 mostra as descrições', async () => {
  const { page } = await abrir(amb, { largura: 820, altura: 1180 });
  await page.setViewport({ width: 1180, height: 820 });
  await espera(500);
  assert.ok(await page.$$eval('.producao__painel', l => l.every(p => !p.hidden)));
});

test('Produções: estreitar de 1440 para 390 vira acordeão', async () => {
  const { page } = await abrir(amb);
  await page.setViewport({ width: 390, height: 844 });
  await espera(500);
  const b = '.producao:first-child .producao__botao';
  assert.ok(await page.$$eval('.producao__painel', l => l.every(p => p.hidden)));
  await rolarPara(page, '#producoes');
  await page.click(b);
  assert.equal(await page.$eval(b, e => e.getAttribute('aria-expanded')), 'true');
});

// #7 — foco em link de set escondido leva até o set
test('focar o link do set 5 mostra o set 5', async () => {
  const { page } = await abrir(amb);
  await page.focus('.set:nth-child(5) .set__link');
  await espera(1200);
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '05 / 08');
  assert.ok(await page.$eval('.set:nth-child(5) .set__link', a => {
    const r = a.getBoundingClientRect();
    return a.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
  }));
});

// #8 — leitor de tela não pode ouvir "0" nos números
test('números: o leitor de tela ouve os valores finais antes do scroll', async () => {
  const { page } = await abrir(amb);
  const raiz = await page.$('#numeros');
  const arvore = await page.accessibility.snapshot({ root: raiz, interestingOnly: false });
  const textos = [];
  (function andar(n) { if (n.name) textos.push(n.name); (n.children ?? []).forEach(andar); })(arvore);
  const tudo = textos.join(' | ');
  for (const v of ['288 mil+', '2017', '3×', '2.000+']) assert.ok(tudo.includes(v), `${v} em: ${tudo}`);
  assert.ok(!/\b0 mil\+/.test(tudo), tudo);
});

// #13 — rabisco da assinatura visível no celular em retrato
test('celular em retrato: o rabisco da assinatura fica dentro da tela', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#assinatura', 600);
  const fracao = await page.evaluate(() => {
    const p = [...document.querySelectorAll('.assinatura__traco')].find(e => e.closest('svg').getBoundingClientRect().width > 0);
    const r = p.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return (w * h) / (r.width * r.height);
  });
  assert.ok(fracao > 0.85, String(fracao));
});
