import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarFaixa, posicaoFaixa } from '../../js/ceu.js';

// desktop, celular em pé, tela grande e celular deitado (mais largo que o CELULAR: contagem do desktop)
const TELAS = [[1440, 900, 170], [390, 844, 90], [1920, 1080, 170], [844, 390, 170]];

test('faixa: todos fora da tela no começo e no fim', () => {
  for (const [W, H, n] of TELAS) {
    const f = criarFaixa(n, 101);
    for (const u of [0, 1]) {
      assert.ok(f.every(m => { const { x } = posicaoFaixa(m, u, 0, W, H); return x < -60 || x > W + 60; }), `${W}×${H} u=${u}`);
    }
  }
});

test('faixa: no pico cobre a largura inteira', () => {
  for (const [W, H, n] of TELAS) {
    const f = criarFaixa(n, 101), limite = W < 600 ? 40 : 60;
    for (const u of [0.45, 0.5, 0.55]) {
      const xs = f.map(m => posicaoFaixa(m, u, 0, W, H).x).filter(x => x >= 0 && x <= W).sort((a, b) => a - b);
      let vao = xs.length ? Math.max(xs[0], W - xs.at(-1)) : W;
      for (let i = 1; i < xs.length; i++) vao = Math.max(vao, xs[i] - xs[i - 1]);
      assert.ok(vao < limite, `${W}×${H} u=${u}: vão de ${Math.round(vao)} px`);
    }
  }
});

test('faixa: no meio da altura', () => {
  for (const [W, H, n] of TELAS) {
    const ys = criarFaixa(n, 101).map(m => posicaoFaixa(m, 0.5, 0, W, H).y);
    assert.ok(Math.min(...ys) >= 0.25 * H && Math.max(...ys) <= 0.75 * H, `${W}×${H}`);
  }
});

test('criarFaixa é determinística', () => assert.deepEqual(criarFaixa(10, 7), criarFaixa(10, 7)));
