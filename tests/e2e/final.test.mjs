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
  await rolarPara(page, '#assinatura', 3 * 900 - 900);
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
  await rolarPara(page, '#assinatura', 3 * 900 - 900);
  await page.setViewport({ width: 900, height: 1200 });
  await new Promise(r => setTimeout(r, 900));
  await rolarPara(page, '#assinatura', 3 * 1200 - 1200);
  await new Promise(r => setTimeout(r, 400));
  assert.ok(await escuros(page) > 3000);
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

test('header fica escuro sobre o Contrate', async () => {
  const { page } = await abrir(amb);
  await rolarPara(page, '#contrate', 10);
  assert.ok(await page.$eval('header', h => h.classList.contains('header--escuro')));
});
