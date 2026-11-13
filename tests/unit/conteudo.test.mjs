import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

test('rodapé credita o site e a foto mantém o crédito no alt', () => {
  const rodape = html.match(/<footer class="rodape">([\s\S]*?)<\/footer>/)?.[1] ?? '';
  assert.match(rodape, /<p class="rotulo">© 2026 Brunin Tks · Site por M\. Wesley<\/p>/);
  assert.ok(!html.includes('Fotos @clicksbylt'));
  assert.match(html, /<img[^>]*foto-22-tks\.webp[^>]*alt="[^"]*Foto @clicksbylt/);
});
