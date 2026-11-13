import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUADROS, QUADROS_D, VIEWBOX, pose } from '../../js/morcego.js';

const nums = d => d.match(/-?\d+(\.\d+)?/g).map(Number);

test('32 quadros fechados', () => {
  assert.equal(QUADROS, 32);
  assert.equal(QUADROS_D.length, 32);
  assert.ok(QUADROS_D.every(d => d.startsWith('M') && d.trim().endsWith('Z')));
});

test('todos os quadros cabem no viewBox', () => {
  const [x, y, w, h] = VIEWBOX.split(' ').map(Number);
  for (const d of QUADROS_D) {
    const n = nums(d);
    for (let i = 0; i < n.length; i += 2) assert.ok(n[i] >= x && n[i] <= x + w && n[i + 1] >= y && n[i + 1] <= y + h);
  }
});

test('batida fluida: nenhum ponto pula mais de 10 unidades entre quadros vizinhos', () => {
  // a ponta anda ~8 unidades por quadro na batida normal; um salto de pose passaria bem de 10
  const ps = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI));
  for (let i = 0; i < 32; i++) {
    const a = ps[i], b = ps[(i + 1) % 32];
    assert.ok(a.every((p, k) => Math.hypot(p.x - b[k].x, p.y - b[k].y) < 10));
  }
});

test('a ponta da asa esquerda sobe e desce mais de 20 unidades', () => {
  const r = pose(0), iPonta = r.reduce((m, p, k) => (p.x < r[m].x ? k : m), 0); // mesmo índice em todos os quadros
  const ys = Array.from({ length: 32 }, (_, i) => pose(i / 32 * 2 * Math.PI)[iPonta].y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 20);
});

test('o corpo só sobe e desce', () => {
  const corpo = f => pose(f).filter(p => Math.abs(p.x) < 2); // pontos perto do eixo do corpo
  const a = corpo(0), b = corpo(Math.PI);
  assert.ok(a.length > 0 && a.length === b.length && a.every((p, k) => Math.abs(p.x - b[k].x) < 0.01));
});
