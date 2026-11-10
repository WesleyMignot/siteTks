import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASAS_D, CORPO_D, VIEWBOX } from '../../js/morcego.js';

test('silhueta: paths fechados e simétricos', () => {
  assert.match(CORPO_D, /^M-4 -6 .* Z$/);
  assert.equal((ASAS_D.match(/Z/g) ?? []).length, 2); // duas asas
  assert.ok(ASAS_D.includes(' 27 -9') && ASAS_D.includes(' -27 -9')); // pontas espelhadas
  assert.equal(VIEWBOX, '-28 -14 56 26');
});
