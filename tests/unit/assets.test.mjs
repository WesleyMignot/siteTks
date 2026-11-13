import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const tam = p => statSync(join(RAIZ, p)).size;
const FOTOS = ['21', '22', '29', '31', '32', '39', '43', '57'];

test('fotos cor e tks ≤ 350 KB', () => {
  for (const f of FOTOS) for (const v of ['cor', 'tks'])
    assert.ok(tam(`assets/img/foto-${f}-${v}.webp`) <= 350_000, `${f}-${v}`);
});
test('texturas ≤ 200 KB', () => {
  for (const t of ['preto-no-vermelho', 'vermelho-no-preto', 'creme-no-preto', 'vermelho-no-creme'])
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
  for (const n of ['maos', 'pista', 'cabine'])
    assert.ok(tam(`assets/video/sets/${n}.mp4`) <= 450_000, n);
  for (const n of ['senso', 'grau', 'ataque', 'veneno-lab', 'sensi', 'maos', 'pista', 'cabine'])
    assert.ok(tam(`assets/video/sets/${n}.jpg`) > 0, n);
  assert.ok(tam('assets/img/boiler-quadro.webp') <= 250_000);
});
