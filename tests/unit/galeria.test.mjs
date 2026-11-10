import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutGaleria, envolverZ, aparencia, criarRng } from '../../js/galeria.js';

test('criarRng é determinístico e fica em [0,1)', () => {
  const a = criarRng(7), b = criarRng(7);
  for (let i = 0; i < 50; i++) { const v = a(); assert.equal(v, b()); assert.ok(v >= 0 && v < 1); }
});

test('layout determinístico e dentro dos limites', () => {
  const a = layoutGaleria(15, { semente: 7, prof: 3000 });
  assert.deepEqual(a, layoutGaleria(15, { semente: 7, prof: 3000 }));
  assert.notDeepEqual(a, layoutGaleria(15, { semente: 8, prof: 3000 }));
  for (const i of a) {
    assert.ok(Math.abs(i.x) <= 0.9 && Math.abs(i.y) <= 0.9);
    assert.ok(Math.abs(i.rx) <= 25 && Math.abs(i.ry) <= 25 && Math.abs(i.rz) <= 12);
    assert.ok(i.z <= 0 && i.z > -3000);
  }
  assert.equal(new Set(a.map(i => i.z)).size, 15);
});

test('envolverZ', () => {
  assert.equal(envolverZ(400, 3000, 400), 400);
  assert.equal(envolverZ(401, 3000, 400), -2599);
  assert.equal(envolverZ(-2600, 3000, 400), 400);
  const z = envolverZ(1e9 + 0.5, 3000, 400);
  assert.ok(z > -2600 && z <= 400);
});

test('aparencia: fundo apagado, meio cheio, frente some', () => {
  const fundo = aparencia(-2599, 3000, 400), meio = aparencia(-800, 3000, 400), frente = aparencia(400, 3000, 400);
  assert.ok(fundo.opacidade < 0.01 && fundo.blur > 5.9);
  assert.equal(meio.opacidade, 1);
  assert.equal(frente.opacidade, 0);
  assert.ok(fundo.brilho < meio.brilho && meio.brilho < frente.brilho);
});
