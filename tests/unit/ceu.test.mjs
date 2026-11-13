import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarNuvem, posicaoNuvem } from '../../js/ceu.js';

const W = 1440, H = 900;

test('nuvem: todos fora da tela no começo e no fim da virada', () => {
  const n = criarNuvem(90, 3);
  for (const u of [0, 1]) {
    assert.ok(n.every(m => { const p = posicaoNuvem(m, u, 0, W, H); return p.x < -20 || p.x > W + 20; }), String(u));
  }
});

test('nuvem: no meio da virada a maioria está na tela', () => {
  const n = criarNuvem(90, 3);
  const dentro = n.filter(m => { const p = posicaoNuvem(m, 0.5, 0, W, H); return p.x > 0 && p.x < W && p.y > -50 && p.y < H + 50; });
  assert.ok(dentro.length > 70, String(dentro.length));
});

test('criarNuvem é determinística', () => assert.deepEqual(criarNuvem(10, 7), criarNuvem(10, 7)));

test('nuvem no celular (390×844): larga, mas fora da tela no começo e no fim', () => {
  const n = criarNuvem(40, 3), w = 390, h = 844;
  for (const u of [0, 1]) assert.ok(n.every(m => { const p = posicaoNuvem(m, u, 0, w, h); return p.x < -20 || p.x > w + 20; }), String(u));
  const xs = n.map(m => posicaoNuvem(m, 0.5, 0, w, h).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5 * w, 'espalhada na horizontal');
});
