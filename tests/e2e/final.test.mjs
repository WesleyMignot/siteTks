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

test('assinatura desenha o traço com o scroll', async () => {
  const { page } = await abrir(amb);
  const off = () => page.$eval('.assinatura__traco', p => parseFloat(getComputedStyle(p).strokeDashoffset));
  await rolarPara(page, '#assinatura', 10);
  const a = await off();
  await rolarPara(page, '#assinatura', 900);
  assert.ok(await off() < a);
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
