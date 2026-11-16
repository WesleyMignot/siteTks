import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

test('rodapé credita o site e a foto mantém o crédito no alt', () => {
  const rodape = html.match(/<footer class="rodape">([\s\S]*?)<\/footer>/)?.[1] ?? '';
  assert.match(rodape, /<p class="rotulo">© 2026 Brunin Tks · Site por M\. Wesley<\/p>/);
  assert.ok(!html.includes('Fotos @clicksbylt'));
  assert.match(html, /<img[^>]*foto-22-tks\.webp[^>]*alt="[^"]*Foto @clicksbylt/);
});

// GitHub Pages: o site mora em https://wesleymignot.github.io/siteTks/. WhatsApp, Instagram e X só montam a prévia
// do link com o endereço completo da imagem; o .nojekyll faz o Pages servir os arquivos como estão (sem Jekyll).
const SITE = 'https://wesleymignot.github.io/siteTks/';

test('prévia do link usa o endereço completo do site publicado', () => {
  assert.match(html, new RegExp(`<meta property="og:url" content="${SITE}">`));
  assert.match(html, new RegExp(`<meta property="og:image" content="${SITE}assets/og\.jpg">`));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${SITE}assets/og\.jpg">`));
});

test('.nojekyll na raiz: o Pages publica os arquivos sem processar', () => {
  assert.ok(existsSync(new URL('../../.nojekyll', import.meta.url)));
});

// rodada 5: o line-up vira um cartaz de festival em três níveis (Nanda Tsunami sobe para o destaque)
const N1 = ['KL Jay', 'Rincon Sapiência'];
const N2 = ['Pocah', 'Raffa Moreira', 'MC Binn', 'MC Felipinho', 'Wesley Gonzaga', 'Nanda Tsunami'];
const N3 = ['DJ Patife', 'Caio Prince', 'Bonekinha Iraquiana', 'Ramon Sucesso', 'Young Clubber', 'Carlos do Complexo',
  'Idlibra', 'Dayeh', 'Bassan', 'Kenan e Kel', 'DJ Lorrany', 'Brum'];
const nomesDo = nivel => [...(html.match(new RegExp(`<p class="cartaz__${nivel}[^"]*">([\\s\\S]*?)</p>`))?.[1] ?? '')
  .matchAll(/<span class="cartaz__nome">([^<]+)<\/span>/g)].map(m => m[1]);

test('cartaz: níveis, rodapé e selo', () => {
  assert.deepEqual(nomesDo('n1'), N1);
  assert.deepEqual(nomesDo('n2'), N2);
  assert.deepEqual(nomesDo('n3'), N3);
  assert.match(html, /class="cartaz__pe[^"]*"[^>]*>[\s\S]*?Palcos, festas e rádios[\s\S]*?Relativa \(Madri\)/);
  assert.match(html, /class="cartaz__selo"[\s\S]*?3 edições do Planeta Atlântida/);
  assert.ok(!html.includes('lineup__palcos'));
});

// rodada 5: seção Agenda (Nº 005) entre o Line-up e a Assinatura; o Contrate passa a Nº 006
test('agenda entre o line-up e a assinatura, com marcadores', () => {
  assert.deepEqual([...html.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]),
    ['hero', 'carreira', 'numeros', 'producoes', 'sets', 'lineup', 'agenda', 'assinatura', 'contrate']);
  assert.equal((html.match(/<!-- agenda:inicio -->/g) ?? []).length, 1);
  assert.equal((html.match(/<!-- agenda:fim -->/g) ?? []).length, 1);
  const secao = html.slice(html.indexOf('<section id="agenda"'), html.indexOf('<section id="assinatura"'));
  const a = secao.indexOf('<!-- agenda:inicio -->'), b = secao.indexOf('<!-- agenda:fim -->');
  assert.ok(a >= 0 && b > a, 'marcadores dentro de #agenda, na ordem');
  assert.match(secao, /<span class="gotica">Nº 005<\/span> — Agenda/);
  assert.match(secao, /<h2 id="t-agenda"[^>]*>Próximos shows<\/h2>/);
  assert.match(secao, /href="https:\/\/useayon\.com\/djbrunintks" target="_blank" rel="noopener"[^>]*>Agenda completa no/);
});

test('menu e numeração: Agenda Nº 005, Contrate Nº 006', () => {
  assert.match(html, /<a href="#agenda"><span class="gotica">Nº 005<\/span> Agenda<\/a>/);
  assert.match(html, /<a href="#contrate"><span class="gotica">Nº 006<\/span> Contrate<\/a>/);
  assert.match(html, /<p class="contrate__num"><span class="gotica">Nº 006<\/span><\/p>/);
});
