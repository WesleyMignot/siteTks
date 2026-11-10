import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const tam = p => statSync(join(RAIZ, p)).size;
const FOTOS = ['21', '22', '29', '31', '32', '39', '43', '57'];
const RECORTES = ['p1-capa', 'p2-moldura', 'p2-maos', 'p3-costas', 'p5-figura', 'p6-cadeira', 'p7-dreads', 'tex-chamas'];
const CLIPES = ['boiler', 'chamas', 'dj-luz', 'filme', 'grade', 'maos', 'pista', 'cabine'];

test('fotos cor e tks ≤ 350 KB', () => {
  for (const f of FOTOS) for (const v of ['cor', 'tks'])
    assert.ok(tam(`assets/img/foto-${f}-${v}.webp`) <= 350_000, `${f}-${v}`);
});
test('recortes ≤ 350 KB', () => {
  for (const r of RECORTES) assert.ok(tam(`assets/recortes/${r}.webp`) <= 350_000, r);
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
