// Agenda (rodada 5): funções puras que leem os dados públicos do Ayon (JSON-LD) e geram o bloco da seção #agenda.
// Sem rede e sem disco: quem busca e grava é tools/agenda.mjs. Tudo que vem do Ayon é dado não confiável:
// texto sai escapado e só URLs https entram.
import { createHash } from 'node:crypto';

const SEIS_HORAS = 6 * 3600_000;
const MARCA_INICIO = '<!-- agenda:inicio -->';
const MARCA_FIM = '<!-- agenda:fim -->';

const erroFormato = motivo => new Error(`formato do Ayon mudou: ${motivo}`);

/** Só URLs https (texto em `u`); o resto vira null. */
function https(u) {
  if (typeof u !== 'string') return null;
  try { return new URL(u).protocol === 'https:' ? u : null; } catch { return null; }
}

const dataValida = s => typeof s === 'string' && !Number.isNaN(Date.parse(s));

/** Todos os nós dos blocos (cada bloco pode ser um nó, uma lista ou um { @graph: [...] }). */
function nos(jsonld) {
  return jsonld.flatMap(b => (Array.isArray(b) ? b : [b])).flatMap(b => (Array.isArray(b?.['@graph']) ? b['@graph'] : [b]));
}
const tipos = n => (Array.isArray(n?.['@type']) ? n['@type'] : [n?.['@type']]).filter(t => typeof t === 'string');
const ehTipo = (n, tipo) => tipos(n).includes(tipo);
/** Event ou um subtipo do schema.org (MusicEvent, Festival...). */
const ehEvento = n => tipos(n).some(t => /Event$|^Festival$/.test(t));
const cancelado = n => /EventCancelled$/.test(String(n.eventStatus ?? ''));

/** Todos os <script type="application/ld+json"> válidos da página (listas achatadas; blocos quebrados ignorados). */
export function lerJsonLd(html) {
  const blocos = [];
  for (const [, texto] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const v = JSON.parse(texto);
      blocos.push(...(Array.isArray(v) ? v : [v]));
    } catch { /* bloco quebrado: ignora */ }
  }
  return blocos;
}

/**
 * Próximos eventos do perfil (nós Event do @graph). Lança erro quando o formato não é o esperado: sem a pessoa do
 * perfil (@id terminando em #profile) ou com um Event sem nome, sem startDate válido ou sem url https.
 * @returns {{ slug, nome, inicio, fim, local, cidade, imagem: string|null, pagina }[]}
 */
export function lerPerfil(jsonld) {
  const todos = nos(jsonld);
  if (!todos.some(n => ehTipo(n, 'Person') && String(n['@id'] ?? '').endsWith('#profile'))) {
    throw erroFormato('o perfil não tem a pessoa (#profile) no JSON-LD');
  }
  return todos.filter(n => ehEvento(n) && !cancelado(n)).map(n => {
    const pagina = https(n.url);
    if (typeof n.name !== 'string' || !n.name.trim()) throw erroFormato('evento sem nome');
    if (!dataValida(n.startDate)) throw erroFormato(`evento sem data de início válida (${n.name})`);
    if (!pagina) throw erroFormato(`evento sem endereço https (${n.name})`);
    const fim = dataValida(n.endDate) ? n.endDate : new Date(Date.parse(n.startDate) + SEIS_HORAS).toISOString();
    const imagem = Array.isArray(n.image) ? n.image[0] : n.image;
    return {
      slug: new URL(pagina).pathname.split('/').filter(Boolean).pop(),
      nome: n.name.trim(),
      inicio: n.startDate,
      fim,
      local: String(n.location?.name ?? '').trim(),
      cidade: String(n.location?.address?.addressLocality ?? '').trim(),
      imagem: https(typeof imagem === 'object' ? imagem?.url : imagem),
      pagina,
    };
  });
}

/** Ingresso (offers.url, https) e line-up cru (performer[].name) da página de um evento. */
export function lerEvento(jsonld) {
  const ev = nos(jsonld).find(ehEvento);
  if (!ev) return { ingresso: null, line: [] };
  const ofertas = Array.isArray(ev.offers) ? ev.offers : [ev.offers];
  const ingresso = ofertas.map(o => https(o?.url)).find(Boolean) ?? null;
  const artistas = Array.isArray(ev.performer) ? ev.performer : ev.performer ? [ev.performer] : [];
  return { ingresso, line: artistas.map(p => (typeof p === 'string' ? p : p?.name)).filter(n => typeof n === 'string' && n.trim()) };
}

/** Line-up sem o próprio Bruno: tira o papel depois de " — ", tira "Brunin TKS" e vira "X (b2b)" quando sobra "b2b X". */
export function limparLine(nomes) {
  return nomes.flatMap(nome => {
    let n = nome.split(' — ')[0].trim();
    if (/brunin\s*tks/i.test(n)) {
      n = n.replace(/brunin\s*tks/gi, '').trim();
      const b2b = n.match(/^b2b\s+(.+)$/i);
      if (b2b) n = `${b2b[1].trim()} (b2b)`;
    }
    return n ? [n] : [];
  });
}

/** Eventos que ainda não acabaram (fim ≥ agora), do mais próximo ao mais distante, no máximo `max`. */
export function proximos(eventos, agora, max = 6) {
  return eventos
    .filter(e => Date.parse(e.fim) >= agora.getTime())
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
    .slice(0, max);
}

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
/** Data no fuso de São Paulo: { dia: '21', mes: 'nov', semana: 'sáb', hora: '19:00' }. */
export function formatarData(iso) {
  const p = Object.fromEntries(formatoData.formatToParts(new Date(iso)).map(x => [x.type, x.value.replace('.', '')]));
  return { dia: p.day, mes: p.month, semana: p.weekday, hora: `${p.hour}:${p.minute}` };
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s).replace(/[&<>"']/g, c => ESCAPES[c]);
const FLYER = /^assets\/agenda\/[a-z0-9-]+\.jpg$/;

function cartao(e, r) {
  const d = formatarData(e.inicio);
  const flyer = FLYER.test(e.flyer ?? '')
    ? `${r}  <img class="evento__flyer" src="${e.flyer}" alt="Flyer de ${esc(e.nome)}" width="640" height="336" loading="lazy" decoding="async">`
    : `${r}  <div class="evento__flyer evento__flyer--vazio" aria-hidden="true"></div>`;
  const ingresso = https(e.ingresso);
  const link = ingresso ?? https(e.pagina);
  const line = e.line?.length
    ? [`${r}    <p class="evento__line">com <b>${esc(e.line.slice(0, 3).join(', '))}</b>${e.line.length > 3 ? ` +${e.line.length - 3}` : ''}</p>`]
    : [];
  const local = e.local ? ` · ${esc(e.local)}` : '';
  return [
    `${r}<article class="evento" data-fim="${esc(e.fim)}">`,
    flyer,
    `${r}  <p class="evento__selo" aria-hidden="true"><span class="titulo">${d.dia}</span><span class="rotulo">${d.mes}</span></p>`,
    `${r}  <div class="evento__corpo">`,
    `${r}    <p class="evento__quando rotulo"><time datetime="${esc(e.inicio)}">${d.semana}<span class="visualmente-oculto">, ${d.dia} de ${d.mes},</span> · ${d.hora}</time>${local}</p>`,
    `${r}    <h3 class="evento__nome titulo">${esc(e.nome)}</h3>`,
    ...line,
    ...(link ? [`${r}    <a class="evento__link botao" href="${esc(link)}" target="_blank" rel="noopener">${ingresso ? 'Ingressos ↗' : 'Ver evento ↗'}<span class="visualmente-oculto"> — ${esc(e.nome)}</span></a>`] : []),
    `${r}  </div>`,
    `${r}</article>`,
  ].join('\n');
}

/**
 * Bloco da agenda (o que fica entre os marcadores): os cartões e o estado "Agenda aberta" (escondido quando há
 * eventos; o JS o mostra se todos passarem). Sem eventos, só o estado vazio, visível.
 */
export function renderizarAgenda(eventos, recuo = '        ') {
  const r = recuo;
  const vazia = [
    `${r}<div class="agenda__vazia"${eventos.length ? ' hidden' : ''}>`,
    `${r}  <p class="agenda__vazia-titulo titulo">Agenda aberta</p>`,
    `${r}  <p>Nenhuma data anunciada agora. Quer o Brunin Tks no seu line?</p>`,
    `${r}  <a class="botao" href="#contrate">Contrate ↓</a>`,
    `${r}</div>`,
  ].join('\n');
  if (!eventos.length) return vazia;
  return [`${r}<div class="agenda__cartoes">`, ...eventos.map(e => cartao(e, `${r}  `)), `${r}</div>`, vazia].join('\n');
}

/**
 * O Ayon não trouxe nenhum show, mas a agenda no ar ainda tem show por vir? Provável mudança de formato (eventos fora do
 * JSON-LD, outro tipo...): o robô para em vez de publicar "Agenda aberta" e apagar os flyers.
 */
export function esvaziamentoSuspeito(htmlAtual, eventos, agora) {
  if (eventos.length) return false;
  const a = htmlAtual.indexOf(MARCA_INICIO), b = htmlAtual.indexOf(MARCA_FIM);
  const bloco = a >= 0 && b > a ? htmlAtual.slice(a, b) : '';
  return [...bloco.matchAll(/data-fim="([^"]+)"/g)].some(([, fim]) => Date.parse(fim) >= agora.getTime());
}

/** Nome do flyer: slug saneado + 8 hex do endereço da imagem (o Ayon troca o endereço quando troca o flyer). */
export function nomeDoFlyer(slug, imagem) {
  const base = String(slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'evento';
  return `${base}-${createHash('sha1').update(String(imagem)).digest('hex').slice(0, 8)}.jpg`;
}

/** Troca o que está entre <!-- agenda:inicio --> e <!-- agenda:fim --> por `bloco` (o recuo do marcador final é mantido). */
export function trocarBloco(html, bloco) {
  const a = html.indexOf(MARCA_INICIO), b = html.indexOf(MARCA_FIM);
  if (a < 0 || b < 0 || b < a) throw new Error('index.html sem os marcadores da agenda (<!-- agenda:inicio --> … <!-- agenda:fim -->)');
  const inicioLinha = html.lastIndexOf('\n', b - 1) + 1;
  const antes = html.slice(inicioLinha, b);
  const recuo = /^[ \t]*$/.test(antes) ? antes : '';
  return `${html.slice(0, a + MARCA_INICIO.length)}\n${bloco}\n${recuo}${html.slice(b)}`;
}
