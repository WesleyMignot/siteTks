import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horaPOA } from '../../js/util.js';

test('horaPOA', () => {
  assert.equal(horaPOA(new Date('2026-11-10T01:10:00Z')), '22:10');
  assert.equal(horaPOA(new Date('2026-07-01T12:05:00Z')), '09:05');
});
