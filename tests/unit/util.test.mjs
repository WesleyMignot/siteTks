import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horaPOA, escolherHero, escolherJanela, formatarContagem, criarRng } from '../../js/util.js';

test('horaPOA', () => {
  assert.equal(horaPOA(new Date('2026-11-10T01:10:00Z')), '22:10');
  assert.equal(horaPOA(new Date('2026-07-01T12:05:00Z')), '09:05');
});

test('escolherJanela', () => {
  assert.equal(escolherJanela(1440), 'assets/video/janela-720.mp4');
  assert.equal(escolherJanela(820), 'assets/video/janela-540.mp4');
});

test('escolherHero', () => {
  assert.equal(escolherHero(1440), 'assets/video/hero-720.mp4');
  assert.equal(escolherHero(820), 'assets/video/hero-540.mp4');
  assert.equal(escolherHero(390), 'assets/video/hero-540.mp4');
});

test('formatarContagem', () => {
  assert.equal(formatarContagem(2000, { milhar: true }), '2.000');
  assert.equal(formatarContagem(287.6), '288');
  assert.equal(formatarContagem(2017), '2017');
});

test('criarRng determinístico em [0,1)', () => {
  const a = criarRng(7), b = criarRng(7);
  for (let i = 0; i < 20; i++) { const v = a(); assert.equal(v, b()); assert.ok(v >= 0 && v < 1); }
});
