import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const tam = p => statSync(join(RAIZ, p)).size;
const FOTOS = ['22']; // só a Carreira usa as fotos do ensaio

test('fotos cor e tks ≤ 350 KB', () => {
  for (const f of FOTOS) for (const v of ['cor', 'tks'])
    assert.ok(tam(`assets/img/foto-${f}-${v}.webp`) <= 350_000, `${f}-${v}`);
});
test('texturas ≤ 200 KB', () => {
  for (const t of ['preto-no-vermelho', 'vermelho-no-preto', 'creme-no-preto', 'vermelho-no-creme', 'preto-no-creme'])
    assert.ok(tam(`assets/texturas/${t}.webp`) <= 200_000, t);
});
test('sem clipes órfãos do reel em assets/video (os dos sets ficam em sets/)', () => {
  const soltos = readdirSync(join(RAIZ, 'assets/video')).filter(f => /\.(mp4|jpg)$/.test(f));
  assert.deepEqual(soltos.filter(f => !/^(hero|janela|logo-fim)[-.]/.test(f)), []);
});
test('hero', () => {
  assert.ok(tam('assets/video/hero-720.mp4') <= 4_500_000);
  assert.ok(tam('assets/video/hero-540.mp4') <= 3_000_000);
  assert.ok(tam('assets/video/hero.jpg') > 0);
});
test('og e pdf', () => {
  assert.ok(tam('assets/og.jpg') <= 300_000);
  assert.ok(tam('assets/presskit.pdf') > 1_000_000);
});

test('janela do hero', () => {
  assert.ok(tam('assets/video/janela-720.mp4') <= 1_800_000);
  assert.ok(tam('assets/video/janela-540.mp4') <= 1_200_000);
  assert.ok(tam('assets/video/janela-720.jpg') > 0);
});

test('clipes dos reels nos sets', () => {
  for (const n of ['reel-a', 'reel-b', 'reel-c']) {
    assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 450_000, n);
    assert.ok(tam(`assets/video/sets/${n}.jpg`) > 0, n);
  }
});

test('clipes dos sets', () => {
  for (const n of ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi'])
    assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 700_000, n);
  for (const n of ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi'])
    assert.ok(tam(`assets/video/sets/${n}.jpg`) > 0, n);
});

test('fotos das produções ≤ 300 KB', () => {
  for (const n of ['savage', 'boiler', 'sonora']) assert.ok(tam(`assets/img/producao-${n}.webp`) <= 300_000, n);
});

test('sem imagens órfãs em assets/img', () => {
  const usado = ['index.html', 'css/base.css', 'css/secoes.css', ...readdirSync(join(RAIZ, 'js')).map(f => `js/${f}`)]
    .map(f => readFileSync(join(RAIZ, f), 'utf8')).join('\n');
  assert.deepEqual(readdirSync(join(RAIZ, 'assets/img')).filter(f => !usado.includes(f)), []);
});

test('sem clipes órfãos em assets/video/sets', () => {
  const usados = ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'reel-a', 'reel-b', 'reel-c']
    .flatMap(n => [n, `${n}-cel`]);
  assert.deepEqual(readdirSync(join(RAIZ, 'assets/video/sets')).filter(f => !usados.includes(f.replace(/\.(mp4|jpg)$/, ''))), []);
});

// rodada 5: versões verticais (celular em pé) dos 6 sets horizontais, enquadradas no Bruno
const SETS_CEL = ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'reel-c'];
test('versões -cel dos 6 sets horizontais cabem no orçamento', () => {
  for (const n of SETS_CEL) {
    assert.ok(tam(`assets/video/sets/${n}-cel.mp4`) <= 700_000, `${n}-cel.mp4`);
    const p = tam(`assets/video/sets/${n}-cel.jpg`);
    assert.ok(p > 0 && p <= 120_000, `${n}-cel.jpg`);
  }
});

// rodada 5: flyers da agenda, gravados pelo robô (tools/agenda.mjs)
test('flyers da agenda cabem no orçamento e os do index.html existem', () => {
  const pasta = join(RAIZ, 'assets/agenda');
  const flyers = existsSync(pasta) ? readdirSync(pasta).filter(f => f.endsWith('.jpg')) : [];
  for (const f of flyers) assert.ok(tam(`assets/agenda/${f}`) <= 120_000, f);
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
  for (const [, src] of html.matchAll(/src="(assets\/agenda\/[^"]+)"/g)) assert.ok(existsSync(join(RAIZ, src)), src);
});
