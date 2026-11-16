import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horaPOA, escolherHero, escolherJanela, formatarContagem, criarRng, fimDaJanela, escolherVersaoSet, passou } from '../../js/util.js';

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

test('fimDaJanela: altura da tela, à direita quando cabe, centralizado quando não', () => {
  assert.deepEqual(fimDaJanela(1440, 900), { l: 933.75, t: 0, w: 506.25, h: 900 });
  assert.deepEqual(fimDaJanela(390, 844), { l: -42.375, t: 0, w: 474.75, h: 844 });
  assert.deepEqual(fimDaJanela(450, 800), { l: 0, t: 0, w: 450, h: 800 }); // limite w = W
});

test('escolherVersaoSet: retrato usa a versão do celular quando existe', () => {
  const v = { src: 'a.mp4', srcCel: 'a-cel.mp4', poster: 'a.jpg', posterCel: 'a-cel.jpg' };
  assert.deepEqual(escolherVersaoSet(v, true), { src: 'a-cel.mp4', poster: 'a-cel.jpg' });
  assert.deepEqual(escolherVersaoSet(v, false), { src: 'a.mp4', poster: 'a.jpg' });
  assert.deepEqual(escolherVersaoSet({ src: 'b.mp4', poster: 'b.jpg' }, true), { src: 'b.mp4', poster: 'b.jpg' });
});

test('passou: o show acabou depois do fim (fuso respeitado)', () => {
  assert.equal(passou('2026-11-22T02:00:00-03:00', new Date('2026-11-22T05:00:01Z')), true);
  assert.equal(passou('2026-11-22T02:00:00-03:00', new Date('2026-11-22T04:59:59Z')), false);
  assert.equal(passou('2026-11-22T02:00:00-03:00', new Date('2026-11-22T05:00:00Z')), false); // no minuto do fim ainda vale
});
