import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  lerJsonLd, lerPerfil, lerEvento, limparLine, proximos, formatarData, renderizarAgenda, trocarBloco, esvaziamentoSuspeito, nomeDoFlyer,
} from '../../tools/agenda-dados.mjs';

// fixtures: só os blocos JSON-LD das páginas reais do Ayon (16/11/2026)
const fixture = n => JSON.parse(readFileSync(new URL(`../fixtures/ayon/${n}.json`, import.meta.url), 'utf8')).jsonld;
const perfil = fixture('perfil');
const PESSOA = { '@type': 'Person', '@id': 'https://useayon.com/djbrunintks#profile' };
const evento = (mais = {}) => ({
  slug: 'x', nome: 'Show', inicio: '2026-11-21T19:00:00-03:00', fim: '2026-11-22T02:00:00-03:00', local: 'Lugar',
  cidade: 'Porto Alegre', imagem: null, pagina: 'https://useayon.com/eventos/e/x', ingresso: 'https://shotgun.live/events/x',
  line: [], flyer: null, ...mais,
});

test('lerJsonLd lê os blocos válidos e ignora os quebrados', () => {
  const html = '<script type="application/ld+json">{"a":1}</script><p>x</p>'
    + '<script type="application/ld+json">{quebrado</script><script type="application/ld+json">[{"b":2}]</script>';
  assert.deepEqual(lerJsonLd(html), [{ a: 1 }, { b: 2 }]);
});

test('lerPerfil lê os 3 próximos do perfil real', () => {
  const ev = lerPerfil(perfil);
  assert.deepEqual(ev.map(e => e.nome), ['ESTREIA NIMBO NO CÉU', 'Boiler Baile • Gran Finale', 'Última Sonora Breck Do Ano Ft Gp Da Zl']);
  assert.deepEqual(ev.map(e => e.slug),
    ['estreia-nimbo-no-ceu-21-11-2026', 'boiler-baile-gran-finale-28-11-2026', 'ultima-sonora-breck-do-ano-ft-gp-da-zl-04-12-2026']);
  assert.equal(ev[0].local, 'Céu zona sul');
  assert.equal(ev[0].cidade, 'Porto Alegre');
  assert.equal(ev[0].inicio, '2026-11-21T19:00:00-03:00');
  assert.equal(ev[0].fim, '2026-11-22T02:00:00-03:00');
  assert.equal(ev[0].imagem, 'https://cdn.useayon.com/events/452/cover-1794411546468.webp');
  assert.equal(ev[0].pagina, 'https://useayon.com/eventos/e/estreia-nimbo-no-ceu-21-11-2026');
});

test('lerPerfil: fim padrão e fuso', () => {
  const [e] = lerPerfil([{ '@graph': [PESSOA, {
    '@type': 'Event', name: 'Show Z', startDate: '2026-11-21T22:00:00Z', url: 'https://useayon.com/eventos/e/show-z',
    image: ['http://inseguro.example/capa.jpg'], location: { name: 'Bar', address: { addressLocality: 'Porto Alegre' } },
  }] }]);
  assert.equal(Date.parse(e.fim) - Date.parse(e.inicio), 6 * 3600_000);
  assert.deepEqual(formatarData(e.inicio), { dia: '21', mes: 'nov', semana: 'sáb', hora: '19:00' });
  assert.deepEqual(formatarData('2026-12-04T23:00:00-03:00'), { dia: '04', mes: 'dez', semana: 'sex', hora: '23:00' });
  assert.equal(e.imagem, null); // só https
  assert.equal(e.local, 'Bar');
});

test('lerPerfil recusa formato desconhecido', () => {
  const ev = mais => ({ '@type': 'Event', name: 'x', startDate: '2026-11-21T22:00:00Z', url: 'https://useayon.com/eventos/e/x', ...mais });
  assert.throws(() => lerPerfil([]), /formato do Ayon mudou/);
  assert.throws(() => lerPerfil([{ '@graph': [ev()] }]), /formato do Ayon mudou/); // sem a pessoa do perfil
  assert.throws(() => lerPerfil([{ '@graph': [PESSOA, ev({ startDate: undefined })] }]), /formato do Ayon mudou/);
  assert.throws(() => lerPerfil([{ '@graph': [PESSOA, ev({ startDate: 'amanhã' })] }]), /formato do Ayon mudou/);
  assert.throws(() => lerPerfil([{ '@graph': [PESSOA, ev({ name: '' })] }]), /formato do Ayon mudou/);
  assert.throws(() => lerPerfil([{ '@graph': [PESSOA, ev({ url: 'javascript:alert(1)' })] }]), /formato do Ayon mudou/);
  assert.deepEqual(lerPerfil([{ '@graph': [PESSOA] }]), []); // perfil sem shows: agenda vazia, não é erro
});

test('lerEvento lê ingresso e line', () => {
  const boiler = lerEvento(fixture('evento-boiler'));
  assert.equal(boiler.ingresso, 'https://shotgun.live/events/boiler-baile-gran-finale');
  assert.equal(boiler.line.length, 10);
  assert.equal(boiler.line[0], 'Brunin TKS b2b Dalberth');
  assert.equal(lerEvento(fixture('evento-nimbo')).ingresso, 'https://feedme.click/evento/estreia-nimbo-no-ceu');
  assert.equal(lerEvento([{ '@type': 'Event', offers: [{ url: 'https://a.example/x' }] }]).ingresso, 'https://a.example/x');
  assert.equal(lerEvento([{ '@type': 'Event', offers: { url: 'javascript:alert(1)' } }]).ingresso, null);
  assert.deepEqual(lerEvento([]), { ingresso: null, line: [] });
});

test('limparLine tira o Bruno, trata o b2b e tira o papel no line', () => {
  assert.deepEqual(limparLine(['Brunin TKS b2b Dalberth', 'Pedro Bala (SP)']), ['Dalberth (b2b)', 'Pedro Bala (SP)']);
  assert.deepEqual(limparLine(['emersxxn — Warm-up', 'Brunin TKS — Contenção', 'TURVA — Convidada']), ['emersxxn', 'TURVA']);
  assert.deepEqual(limparLine(['brunin tks']), []);
  assert.deepEqual(limparLine(['BlockboyB2Bimnotnv_ — Closing Set · Young New Richs']), ['BlockboyB2Bimnotnv_']);
});

test('proximos mantém o show em andamento, ordena e corta em 6', () => {
  const a = evento({ slug: 'a' });
  assert.deepEqual(proximos([a], new Date('2026-11-21T23:00:00-03:00')).map(e => e.slug), ['a']); // começou, não acabou
  assert.deepEqual(proximos([a], new Date('2026-11-22T02:00:00-03:00')).map(e => e.slug), ['a']); // no minuto do fim
  assert.deepEqual(proximos([a], new Date('2026-11-22T02:00:01-03:00')), []);
  const dia = i => `2026-12-${String(10 - i).padStart(2, '0')}`;
  const varios = Array.from({ length: 8 }, (_, i) => evento({ slug: `e${i}`, inicio: `${dia(i)}T20:00:00-03:00`, fim: `${dia(i)}T23:00:00-03:00` }));
  assert.deepEqual(proximos(varios, new Date('2026-11-01T00:00:00Z')).map(e => e.slug), ['e7', 'e6', 'e5', 'e4', 'e3', 'e2']);
});

test('renderizarAgenda gera cartões e estado vazio', () => {
  const ev = lerPerfil(perfil).map(e => ({ ...e, ingresso: 'https://shotgun.live/events/x', line: ['A', 'B', 'C', 'D'], flyer: null }));
  const h = renderizarAgenda(ev);
  assert.equal((h.match(/<article class="evento"/g) ?? []).length, 3);
  assert.match(h, /data-fim="2026-11-22T02:00:00-03:00"/);
  assert.match(h, /<time datetime="2026-11-21T19:00:00-03:00">sáb[^]*?19:00<\/time> · Céu zona sul/);
  assert.match(h, /<span class="titulo">21<\/span><span class="rotulo">nov<\/span>/);
  assert.match(h, /<h3 class="evento__nome titulo">ESTREIA NIMBO NO CÉU<\/h3>/);
  assert.match(h, /com <b>A, B, C<\/b> \+1/);
  assert.match(h, /target="_blank" rel="noopener">Ingressos ↗/);
  assert.match(h, /evento__flyer--vazio/);
  assert.match(h, /<div class="agenda__vazia" hidden>/);

  const comFlyer = renderizarAgenda([{ ...ev[0], flyer: 'assets/agenda/estreia-nimbo-no-ceu-21-11-2026.jpg' }]);
  assert.match(comFlyer, /<img class="evento__flyer" src="assets\/agenda\/estreia-nimbo-no-ceu-21-11-2026\.jpg" alt="Flyer de ESTREIA NIMBO NO CÉU"/);

  const semIngresso = renderizarAgenda([{ ...ev[0], ingresso: null, line: [] }]);
  assert.match(semIngresso, /href="https:\/\/useayon\.com\/eventos\/e\/estreia-nimbo-no-ceu-21-11-2026"[^>]*>Ver evento ↗/);
  assert.ok(!semIngresso.includes('evento__line'));

  const vazio = renderizarAgenda([]);
  assert.ok(!vazio.includes('agenda__cartoes'));
  assert.match(vazio, /<div class="agenda__vazia">/);
  assert.match(vazio, /Agenda aberta/);
  assert.match(vazio, /Nenhuma data anunciada agora\. Quer o Brunin Tks no seu line\?/);
  assert.match(vazio, /href="#contrate">Contrate ↓/);
});

test('renderizarAgenda escapa texto e recusa URL que não é https', () => {
  const h = renderizarAgenda([evento({
    nome: '<b>&"x"</b>', local: 'Bar & Cia', line: ['<i>'], ingresso: 'javascript:alert(1)',
    flyer: 'assets/agenda/../../index.html',
  })]);
  assert.ok(!h.includes('<b>&"x"</b>'));
  assert.match(h, /&lt;b&gt;&amp;&quot;x&quot;&lt;\/b&gt;/);
  assert.match(h, /Bar &amp; Cia/);
  assert.match(h, /&lt;i&gt;/);
  assert.ok(!h.includes('javascript:'));
  assert.match(h, /Ver evento ↗/);
  assert.ok(!h.includes('index.html')); // flyer só como assets/agenda/<slug>.jpg
  assert.match(h, /evento__flyer--vazio/);
});

test('trocarBloco troca só o que está entre os marcadores', () => {
  const html = 'a<!-- agenda:inicio -->velho<!-- agenda:fim -->b';
  assert.equal(trocarBloco(html, 'novo'), 'a<!-- agenda:inicio -->\nnovo\n<!-- agenda:fim -->b');
  const recuado = '<div>\n        <!-- agenda:inicio -->\n        velho\n        <!-- agenda:fim -->\n</div>';
  assert.equal(trocarBloco(recuado, '        novo'), '<div>\n        <!-- agenda:inicio -->\n        novo\n        <!-- agenda:fim -->\n</div>');
  assert.throws(() => trocarBloco('sem marcadores', 'x'), /marcadores/);
  assert.throws(() => trocarBloco('<!-- agenda:fim --><!-- agenda:inicio -->', 'x'), /marcadores/);
});

test('workflow da agenda: a cada 6 h e no botão, com permissão de gravar e publicar', () => {
  const yml = readFileSync(new URL('../../.github/workflows/agenda.yml', import.meta.url), 'utf8');
  for (const trecho of ["cron: '17 */6 * * *'", 'workflow_dispatch', 'contents: write', 'pages: write', 'node tools/agenda.mjs',
    'agenda: atualiza pelo Ayon', 'pages/builds', 'git status --porcelain -- index.html assets/agenda']) {
    assert.ok(yml.includes(trecho), trecho);
  }
});

// revisão final: subtipos de Event, shows cancelados, agenda apagada sem aviso, flyer trocado no Ayon
test('lerPerfil lê subtipos de Event (MusicEvent) e ignora shows cancelados', () => {
  const no = (mais) => ({ '@type': 'Event', startDate: '2026-11-21T22:00:00Z', ...mais });
  const ev = lerPerfil([{ '@graph': [PESSOA,
    no({ '@type': 'MusicEvent', name: 'A', url: 'https://useayon.com/eventos/e/a' }),
    no({ name: 'B', url: 'https://useayon.com/eventos/e/b', eventStatus: 'https://schema.org/EventCancelled' }),
    no({ '@type': ['Event', 'Thing'], name: 'C', url: 'https://useayon.com/eventos/e/c', eventStatus: 'https://schema.org/EventScheduled' }),
  ] }]);
  assert.deepEqual(ev.map(e => e.nome), ['A', 'C']);
  assert.equal(lerEvento([{ '@type': 'MusicEvent', offers: { url: 'https://a.example/x' } }]).ingresso, 'https://a.example/x');
});

test('esvaziamentoSuspeito: Ayon sem shows enquanto o site ainda tem shows por vir', () => {
  const site = eventos => trocarBloco('<!-- agenda:inicio --><!-- agenda:fim -->', renderizarAgenda(eventos));
  const comShow = site([evento({ fim: '2026-11-22T02:00:00-03:00' })]);
  assert.equal(esvaziamentoSuspeito(comShow, [], new Date('2026-11-20T00:00:00Z')), true);
  assert.equal(esvaziamentoSuspeito(comShow, [evento()], new Date('2026-11-20T00:00:00Z')), false);
  assert.equal(esvaziamentoSuspeito(comShow, [], new Date('2026-11-23T00:00:00Z')), false); // os do site já passaram
  assert.equal(esvaziamentoSuspeito(site([]), [], new Date('2026-11-20T00:00:00Z')), false); // já estava vazia
});

test('nomeDoFlyer muda quando o Ayon troca a imagem do show', () => {
  const slug = 'estreia-nimbo-no-ceu-21-11-2026';
  const a = nomeDoFlyer(slug, 'https://cdn.useayon.com/events/452/cover-1.webp');
  assert.equal(a, nomeDoFlyer(slug, 'https://cdn.useayon.com/events/452/cover-1.webp'));
  assert.notEqual(a, nomeDoFlyer(slug, 'https://cdn.useayon.com/events/452/cover-2.webp'));
  assert.match(a, /^estreia-nimbo-no-ceu-21-11-2026-[0-9a-f]{8}\.jpg$/);
  assert.match(nomeDoFlyer('Show Ç/../X', 'https://a.example/b'), /^[a-z0-9-]+\.jpg$/);
  assert.match(renderizarAgenda([evento({ flyer: `assets/agenda/${a}` })]), /<img class="evento__flyer" src="assets\/agenda\//);
});

test('workflow da agenda: publicação que falhou é refeita e não vira só aviso', () => {
  const yml = readFileSync(new URL('../../.github/workflows/agenda.yml', import.meta.url), 'utf8');
  assert.ok(!yml.includes('::warning::'));
  for (const trecho of ['pages/builds/latest', 'git rev-parse HEAD', 'permitir_vazia', 'AGENDA_PERMITIR_VAZIA']) assert.ok(yml.includes(trecho), trecho);
});
