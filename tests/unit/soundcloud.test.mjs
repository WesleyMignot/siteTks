import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urlPlayer } from '../../js/soundcloud.js';

test('urlPlayer: player oficial compacto, vermelho, tocando ao abrir', () => {
  const u = new URL(urlPlayer('https://soundcloud.com/trinkabr/tkm11-brunin-tks'));
  assert.equal(u.origin + u.pathname, 'https://w.soundcloud.com/player/');
  assert.equal(u.searchParams.get('url'), 'https://soundcloud.com/trinkabr/tkm11-brunin-tks');
  assert.equal(u.searchParams.get('color'), '#e8392f');
  assert.equal(u.searchParams.get('auto_play'), 'true');
  assert.equal(u.searchParams.get('visual'), 'false');
});
