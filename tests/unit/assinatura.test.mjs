import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amostrarAlvos, criarMorcegos, fases, estadoMorcego } from '../../js/assinatura.js';

const dims = { W: 1200, H: 700, esc: 1 };
function mascaraRet(W, H, x0, y0, x1, y1) {
  const a = new Uint8ClampedArray(W * H * 4);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[(y * W + x) * 4 + 3] = 255;
  return a;
}

test('amostrarAlvos: tinta dentro, pouso na borda de cima e espaçado', () => {
  const { tinta, pouso } = amostrarAlvos(mascaraRet(200, 120, 40, 50, 160, 90), 200, 120, { nTinta: 60, nPouso: 5, distMin: 20, semente: 3 });
  assert.equal(tinta.length, 60);
  assert.ok(tinta.every(p => p.x >= 40 && p.x < 160 && p.y >= 50 && p.y < 90));
  assert.ok(pouso.length >= 3 && pouso.every(p => p.y >= 50 && p.y <= 52));
  for (const a of pouso) for (const b of pouso) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 20);
});

test('amostrarAlvos: máscara vazia não trava e devolve listas vazias', () => {
  const { tinta, pouso } = amostrarAlvos(new Uint8ClampedArray(50 * 40 * 4), 50, 40, { nTinta: 10, nPouso: 3, distMin: 5, semente: 1 });
  assert.deepEqual([tinta.length, pouso.length], [0, 0]);
});

test('fases: limites', () => {
  assert.equal(fases(0).Bf, 0); assert.equal(fases(0.4).Bf, 0); assert.equal(fases(0.9).Bf, 1); assert.equal(fases(1).Bf, 1);
});

test('criarMorcegos determinístico', () => {
  const alvos = { tinta: [{ x: 600, y: 350 }], pouso: [{ x: 620, y: 300 }] };
  assert.deepEqual(criarMorcegos({ ...alvos, ...dims, semente: 7 }), criarMorcegos({ ...alvos, ...dims, semente: 7 }));
});

test('estadoMorcego: começo fora, fim na assinatura', () => {
  const ms = criarMorcegos({ tinta: [{ x: 600, y: 350 }, { x: 610, y: 360 }], pouso: [{ x: 620, y: 300 }], ...dims, semente: 7 });
  assert.ok(ms.every(m => estadoMorcego(m, 0, 0, dims).visivel === false));
  for (const m of ms) {
    const e = estadoMorcego(m, 1, 5, dims);
    if (m.pousado) { assert.ok(e.visivel); assert.ok(Math.abs(e.x - m.alvo.x) < 1e-6); assert.ok(Math.abs(e.y - (m.alvo.y - 7 * m.tam)) < 1e-6); }
    else assert.equal(e.visivel, false);
  }
});

test('estadoMorcego: no meio da revoada todos estão na tela', () => {
  const tinta = Array.from({ length: 40 }, (_, i) => ({ x: 300 + i * 10, y: 350 }));
  const ms = criarMorcegos({ tinta, pouso: [], ...dims, semente: 9 });
  for (const m of ms) {
    const e = estadoMorcego(m, 0.4, 2, dims);
    assert.ok(e.visivel && e.x > -60 && e.x < dims.W + 60 && e.y > -60 && e.y < dims.H + 60, JSON.stringify(e));
  }
});
