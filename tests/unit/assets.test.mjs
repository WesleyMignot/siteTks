import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const tam = p => statSync(join(RAIZ, p)).size;
const FOTOS = ['21', '22', '29', '31', '32', '39', '43', '57'];
const CLIPES = ['boiler', 'chamas', 'dj-luz', 'filme', 'grade', 'maos', 'pista', 'cabine'];

test('fotos cor e tks ≤ 350 KB', () => {
  for (const f of FOTOS) for (const v of ['cor', 'tks'])
    assert.ok(tam(`assets/img/foto-${f}-${v}.webp`) <= 350_000, `${f}-${v}`);
});
test('texturas ≤ 200 KB', () => {
  for (const t of ['preto-no-vermelho', 'vermelho-no-preto', 'creme-no-preto', 'vermelho-no-creme'])
    assert.ok(tam(`assets/texturas/${t}.webp`) <= 200_000, t);
});
test('clipes ≤ 300 KB com pôster', () => {
  for (const c of CLIPES) {
    assert.ok(tam(`assets/video/${c}.mp4`) <= 300_000, c);
    assert.ok(tam(`assets/video/${c}.jpg`) > 0, `${c}.jpg`);
  }
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
  assert.ok(tam('assets/video/janela-720.mp4') <= 800_000);
  assert.ok(tam('assets/video/janela-720.jpg') > 0);
});
