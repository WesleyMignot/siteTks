import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medirAncora, destinoAncora } from '../../js/ancora.js';

// retângulos como os de getBoundingClientRect: top relativo ao topo da tela
const R = (top, height) => ({ top, height });

test('medirAncora: acha a seção sob o topo da tela e o quanto dela já rolou', () => {
  // seção alta (3000 px, tela de 900): curso de 2100 px; rolou 1050 → metade
  assert.deepEqual(medirAncora([R(-5000, 4000), R(-1050, 3000), R(1950, 800)], 900), { i: 1, fracao: 0.5, resto: 0 });
  // seção curta (600 px): fração da própria altura
  assert.deepEqual(medirAncora([R(-300, 600), R(300, 900)], 900), { i: 0, fracao: 0.5, resto: 0 });
  // seção alta já no fim do curso: o que passa do curso fica em px
  assert.deepEqual(medirAncora([R(-2400, 3000), R(600, 500)], 900), { i: 0, fracao: 1, resto: 300 });
  assert.equal(medirAncora([R(100, 500)], 900), null); // nada sob o topo
});

test('destinoAncora: volta à mesma fração com as medidas novas', () => {
  // a seção passou a ter 2400 px numa tela de 800 (curso 1600) e começa em 5000 no documento
  assert.equal(destinoAncora({ fracao: 0.5, resto: 0 }, { topoDoc: 5000, height: 2400 }, 800), 5800);
  assert.equal(destinoAncora({ fracao: 1, resto: 300 }, { topoDoc: 5000, height: 2400 }, 800), 6900);
  assert.equal(destinoAncora({ fracao: 0.5, resto: 0 }, { topoDoc: 100, height: 600 }, 900), 400);
});
