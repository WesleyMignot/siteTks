import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarFaixa, posicaoFaixa, visivel } from '../../js/ceu.js';

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

// telas largas: o morcego cresce com a tela (esc = W/900); a margem e o recorte têm de crescer junto,
// senão as asas somem de repente na borda (2560×1440: ~49 px de asa sumindo no fim da faixa)
const esc = W => Math.max(0.8, W / 900);
const ASA = 40; // meia envergadura máxima do contorno (37) com folga para o giro

test('faixa: no começo e no fim, nenhuma asa na tela (inclusive telas largas)', () => {
  for (const [W, H, n] of [...TELAS, [2560, 1440, 170], [3840, 2160, 170]]) {
    const f = criarFaixa(n, 101);
    for (const semente of [101, 118]) {
      for (const m of criarFaixa(n, semente)) for (const u of [0, 1]) {
        const { x } = posicaoFaixa(m, u, 0, W, H), r = ASA * m.tam * esc(W);
        assert.ok(x + r < 0 || x - r > W, `${W}×${H} u=${u}: asa em ${Math.round(x - r)}..${Math.round(x + r)}`);
      }
    }
    assert.ok(f.length === n);
  }
});

test('visivel: recorta só o morcego que está inteiro fora da tela, pelo tamanho dele', () => {
  const W = 2560, H = 1440, tam = 4.5; // maior morcego numa tela de 2560
  assert.equal(visivel(-100, 500, tam, W, H), true);   // a asa ainda alcança x = 80
  assert.equal(visivel(-200, 500, tam, W, H), false);
  assert.equal(visivel(W + 100, 500, tam, W, H), true);
  assert.equal(visivel(500, -100, tam, W, H), true);
  assert.equal(visivel(500, H + 200, tam, W, H), false);
  assert.equal(visivel(-60, 400, 1, 390, 844), false); // celular: morcego pequeno a 60 px já está fora
});
