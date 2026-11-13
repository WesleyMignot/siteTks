import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarAmbiente, abrir, rolarPara } from './ajuda.mjs';

let amb;
before(async () => { amb = await iniciarAmbiente(); });
after(async () => { await amb.fechar(); });

const NACIONAIS = ['KL Jay', 'Rincon Sapiência', 'Raffa Moreira', 'MC Binn', 'Pocah', 'MC Felipinho', 'Wesley Gonzaga'];
const UNDER = ['DJ Patife', 'Caio Prince', 'Bonekinha Iraquiana', 'Ramon Sucesso', 'Nanda Tsunami', 'Young Clubber',
  'Carlos do Complexo', 'Idlibra', 'Dayeh', 'Bassan', 'Kenan e Kel', 'DJ Lorrany', 'Brum'];

test('line-up com todos os nomes', async () => {
  const { page } = await abrir(amb);
  const t = await page.$eval('#lineup', e => e.textContent);
  for (const n of [...NACIONAIS, ...UNDER, 'Planeta Atlântida', 'Relativa']) assert.ok(t.includes(n), n);
});

const opacNomes = p => p.$$eval('.cartaz__nome', l => l.map(e => +getComputedStyle(e).opacity));
test('cartaz: nomes acendem com o scroll', async () => {
  const { page } = await abrir(amb);
  await page.evaluate(() => { const c = document.querySelector('.cartaz'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight * 0.85); });
  await new Promise(r => setTimeout(r, 500));
  assert.ok((await opacNomes(page))[0] < 0.5);
  await rolarPara(page, '.cartaz', 200);
  await new Promise(r => setTimeout(r, 500));
  const fim = await opacNomes(page);
  assert.equal(fim.length, 20); assert.ok(fim.every(o => o > 0.9));
});

test('cartaz: leitor de tela ouve os nomes separados', async () => {
  const { page } = await abrir(amb);
  for (const [sel, nomes] of [['.cartaz__nacionais', NACIONAIS], ['.cartaz__under', UNDER]]) {
    const arvore = await page.accessibility.snapshot({ root: await page.$(sel), interestingOnly: false });
    const textos = [];
    (function andar(n) { if (n.role === 'StaticText') textos.push(n.name); (n.children ?? []).forEach(andar); })(arvore);
    const lido = textos.join('').replace(/\s+/g, ' ').trim();
    assert.equal(lido.toLowerCase(), nomes.join(', ').toLowerCase(), sel); // o under tem text-transform: uppercase
  }
});

test('cartaz: 7 nacionais e 13 do underground, separados por morcegos', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('.cartaz__nacionais .cartaz__nome', l => l.map(e => e.textContent.trim())), NACIONAIS);
  assert.deepEqual(await page.$$eval('.cartaz__under .cartaz__nome', l => l.map(e => e.textContent.trim())), UNDER);
  assert.equal(await page.$$eval('.cartaz .div-morcego svg.morcego--div', l => l.length), 6 + 12);
  assert.equal(await page.$('#lineup .letreiro'), null);
});

const escuros = p => p.$eval('.assinatura__tela', c => {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const d = g.getImageData(w * 0.3, h * 0.4, w * 0.4, h * 0.25).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] < 60) n++; return n;
});
test('assinatura: no fim, o "Brunin" está formado no canvas', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await new Promise(r => setTimeout(r, 400));
  assert.ok(await escuros(page) > 5000);
});
test('assinatura: no começo, as letras ainda não existem', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 10);
  await new Promise(r => setTimeout(r, 400));
  assert.ok(await escuros(page) < 1500);
});
test('assinatura: girar a tela no fim mantém o texto formado', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await page.setViewport({ width: 900, height: 1200 });
  await new Promise(r => setTimeout(r, 1200)); // sem rolar de novo: o lugar tem que ser mantido
  assert.ok(await escuros(page) > 3000);
});
const progresso = (page, sel) => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return -r.top / (r.height - innerHeight); });
test('girar o celular no meio da assinatura mantém o lugar (retrato → paisagem → retrato)', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  await rolarPara(page, '#assinatura', Math.round(0.95 * 2.5 * 844));
  await new Promise(r => setTimeout(r, 300));
  await page.setViewport({ width: 844, height: 390 });
  await new Promise(r => setTimeout(r, 1200));
  const deitado = await progresso(page, '#assinatura');
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 1200));
  const empe = await progresso(page, '#assinatura');
  assert.ok(deitado > 0.88 && deitado < 1.01 && empe > 0.88 && empe < 1.01, `${deitado} ${empe}`);
});
test('redimensionar no meio da pilha dos sets mantém o mesmo set na tela', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '.sets__pilha', 2 * 900 + 60);
  await new Promise(r => setTimeout(r, 600));
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
  await page.setViewport({ width: 1200, height: 800 });
  await new Promise(r => setTimeout(r, 1200));
  assert.equal(await page.$eval('.sets__contador', e => e.textContent.trim()), '03 / 08');
});

const escurosCeu = p => p.$eval('.ceu', c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n / (c.width * c.height);
});
test('chegada da assinatura: nuvem cheia, mas o fundo aparece nas frestas', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', -Math.round(0.125 * 900)); // P ≈ 0,25
  await new Promise(r => setTimeout(r, 400));
  const f = await escurosCeu(page);
  assert.ok(f > 0.2 && f < 0.75, String(f));
});
test('assinatura: com a Pirata One lenta, o nome aparece com a reserva depois de 3 s', async () => {
  // atrasar (não bloquear): uma fonte bloqueada falha na hora e não exercita a espera de 3 s
  const { page } = await abrir(amb, { atrasar: [{ re: /fonts\.gstatic\.com/, ms: 15000 }], esperarPronto: false });
  await page.waitForFunction(() => document.body.classList.contains('pronto'), { timeout: 14000 });
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await new Promise(r => setTimeout(r, 3600));
  assert.ok(await escuros(page) > 5000);
});
test('girar no fim da assinatura: pousados do céu continuam sobre as letras', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#assinatura', 2.5 * 900);
  await page.setViewport({ width: 900, height: 1200 });
  await new Promise(r => setTimeout(r, 1500));
  const r = await page.evaluate(() => ({ d: +document.querySelector('.ceu').dataset.desenhados,
    topo: document.querySelector('.assinatura__palco').getBoundingClientRect().top }));
  assert.ok(r.d >= 30 && Math.abs(r.topo) < 2, JSON.stringify(r));
});

test('voltando do Contrate, o "Brunin" reaparece com os pousados', async () => {
  const { page } = await abrir(amb);
  await page.click('#menu-botao'); await page.click('#menu a[href="#contrate"]');
  await new Promise(r => setTimeout(r, 2600));
  // sobe até o palco (já descolado) ficar ~40% na tela: topo do palco em −0,6 tela
  await rolarPara(page, '#assinatura', Math.round(3.1 * 900));
  await new Promise(r => setTimeout(r, 400));
  const r = await page.evaluate(() => ({ d: +document.querySelector('.ceu').dataset.desenhados,
    fundo: document.querySelector('.assinatura__palco').getBoundingClientRect().bottom }));
  assert.ok(r.fundo > 200 && r.d > 0, JSON.stringify(r));
});

test('desempenho: céu em DPR 1 com morcegos voando, nítido de novo com todos pousados', async () => {
  // em navegadores que pintam o canvas na CPU (Safari, Android em blocklist) metade da resolução
  // durante o voo corta ~40% do custo por quadro; os pousados parados voltam a ficar nítidos
  const { page } = await abrir(amb);
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.evaluate(() => dispatchEvent(new Event('resize'))); // mudar só o DPR não dispara resize
  await new Promise(r => setTimeout(r, 400));
  const razao = () => page.$eval('.ceu', c => c.width / c.clientWidth);
  await rolarPara(page, '#assinatura', -Math.round(0.125 * 900)); // P ≈ 0,25: chegada
  await new Promise(r => setTimeout(r, 400));
  assert.equal(await razao(), 1);
  await rolarPara(page, '#assinatura', 2.5 * 900); // P = 1: todos pousados
  await new Promise(r => setTimeout(r, 400));
  assert.equal(await razao(), 2);
});

test('assinatura no modo reduzido: estado final sem scroll', async () => {
  const { page } = await abrir(amb, { menosMovimento: true });
  await rolarPara(page, '#assinatura');
  assert.ok(await escuros(page) > 5000);
});
test('assinatura tem nome para leitor de tela', async () => {
  const { page } = await abrir(amb);
  assert.equal(await page.$eval('#assinatura', s => document.getElementById(s.getAttribute('aria-labelledby')).textContent.trim()), 'Brunin');
});
test('assinatura sem JS: o nome aparece como texto', async () => {
  const { page } = await abrir(amb, { semJs: true, esperarPronto: false });
  assert.ok(await page.$eval('#t-assinatura', h => h.getBoundingClientRect().width > 200));
});

test('contrate: contatos exatos e PDF disponível', async () => {
  const { page } = await abrir(amb);
  assert.deepEqual(await page.$$eval('#contrate .contato a', l => l.map(a => a.getAttribute('href'))), [
    'mailto:contato.bruninn@gmail.com', 'https://wa.me/5551980407711', 'https://www.instagram.com/djbrunintks',
    'https://drive.google.com/drive/folders/1ggulWuIW_njZD_iznFLcxt8tv8GtZnso', 'assets/presskit.pdf']);
  assert.equal(await page.evaluate(() => fetch('assets/presskit.pdf').then(r => r.status)), 200);
});

test('contrate: cada link tem ícone escondido do leitor de tela', async () => {
  const { page } = await abrir(amb);
  assert.ok(await page.$$eval('#contrate .contato a', l => l.length === 5 && l.every(a => {
    const s = a.querySelector('svg.contato__icone'); return s && s.getAttribute('aria-hidden') === 'true'; })));
});

test('contrate: no hover a linha se enche de preto e o texto fica creme', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#contrate', 10);
  const link = (await page.$$('#contrate .contato a'))[2];
  await link.hover();
  await new Promise(r => setTimeout(r, 800));
  const { fundo, cor } = await link.evaluate(a => ({
    fundo: getComputedStyle(a, '::before').transform, cor: getComputedStyle(a).color }));
  assert.equal(fundo, 'matrix(1, 0, 0, 1, 0, 0)');
  assert.equal(cor, 'rgb(241, 226, 196)');
});

test('contrate no celular: rótulo acima do valor e nada vaza da tela', async () => {
  const { page } = await abrir(amb, { largura: 390, altura: 844 });
  const r = await page.$$eval('#contrate .contato a', l => l.map(a => {
    const rot = a.querySelector('.contato__rotulo').getBoundingClientRect(), val = a.querySelector('.contato__valor').getBoundingClientRect();
    return { acima: rot.bottom <= val.top + 1, dentro: val.right <= innerWidth && a.getBoundingClientRect().right <= innerWidth };
  }));
  assert.ok(r.every(x => x.acima && x.dentro), JSON.stringify(r));
});

test('header fica escuro sobre o Contrate', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#contrate', 10);
  assert.ok(await page.$eval('header', h => h.classList.contains('header--escuro')));
});

// pixels quase pretos e opacos num canvas (o contorno; os morcegos das viradas são vermelhos)
const pretos = (p, sel) => p.$eval(sel, c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] < 60 && d[i + 1] < 60 && d[i + 2] < 60) n++;
  return n;
});
test('contorno: morcegos da virada com linha preta', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#sets', -450);
  await new Promise(r => setTimeout(r, 300));
  const n = await pretos(page, '.ceu');
  assert.ok(n > 500, String(n));
});
