// Robô da agenda (rodada 5): lê os próximos shows do Brunin no Ayon, grava os flyers em assets/agenda/ e reescreve o
// bloco da seção #agenda no index.html (entre <!-- agenda:inicio --> e <!-- agenda:fim -->).
// Roda a cada 6 h no GitHub Actions (.github/workflows/agenda.yml) e também à mão:  node tools/agenda.mjs
// Se o perfil não responder ou o formato do Ayon mudar, sai com código 1 sem gravar nada: o site fica como estava.
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';
import { lerJsonLd, lerPerfil, lerEvento, limparLine, proximos, renderizarAgenda, trocarBloco } from './agenda-dados.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PERFIL = 'https://useayon.com/djbrunintks';
const UA = 'siteTks-agenda (+https://wesleymignot.github.io/siteTks/)';
const PASTA = join(RAIZ, 'assets', 'agenda');
const LIMITE = 120_000; // bytes por flyer

async function buscar(url, binario = false) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return binario ? Buffer.from(await r.arrayBuffer()) : r.text();
}

/** Flyer em JPEG de 640 px de largura, baixando a qualidade de 5 em 5 até caber no limite. */
async function reduzir(bruto) {
  for (let q = 78; q >= 33; q -= 5) {
    const jpg = await sharp(bruto).rotate().resize({ width: 640 }).flatten({ background: '#0F1211' })
      .jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (jpg.length <= LIMITE) return jpg;
  }
  throw new Error(`não coube em ${LIMITE / 1000} KB`);
}

/** Nome de arquivo seguro para o flyer (o slug vem da URL do Ayon). */
const nomeDoFlyer = slug => `${slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'evento'}.jpg`;

async function principal() {
  // 1. perfil: se falhar aqui, nada foi gravado
  const futuros = proximos(lerPerfil(lerJsonLd(await buscar(PERFIL))), new Date());

  // 2. cada evento: ingresso e line-up (falha → link do Ayon, sem line-up) e flyer (só baixa o que ainda não tem)
  await mkdir(PASTA, { recursive: true });
  const existentes = new Set((await readdir(PASTA)).filter(f => f.endsWith('.jpg')));
  const eventos = [];
  for (const e of futuros) {
    let detalhes = { ingresso: null, line: [] };
    try { detalhes = lerEvento(lerJsonLd(await buscar(e.pagina))); } catch (err) { console.warn(`aviso: ${e.slug}: página do evento (${err.message})`); }
    const arquivo = nomeDoFlyer(e.slug);
    let flyer = existentes.has(arquivo) ? `assets/agenda/${arquivo}` : null;
    if (!flyer && e.imagem) {
      try {
        await writeFile(join(PASTA, arquivo), await reduzir(await buscar(e.imagem, true)));
        flyer = `assets/agenda/${arquivo}`;
      } catch (err) { console.warn(`aviso: ${e.slug}: flyer (${err.message})`); }
    }
    eventos.push({ ...e, ingresso: detalhes.ingresso, line: limparLine(detalhes.line), flyer });
    console.log(`${e.inicio.slice(0, 16).replace('T', ' ')}  ${e.nome}${flyer ? '' : '  (sem flyer)'}${detalhes.ingresso ? '' : '  (sem ingresso)'}`);
  }

  // 3. flyers de shows que saíram da agenda
  const usados = new Set(eventos.filter(e => e.flyer).map(e => e.flyer.split('/').pop()));
  for (const f of existentes) if (!usados.has(f)) await unlink(join(PASTA, f));

  // 4. index.html, só se mudou
  const caminho = join(RAIZ, 'index.html');
  const antes = await readFile(caminho, 'utf8');
  const depois = trocarBloco(antes, renderizarAgenda(eventos));
  if (depois === antes) console.log(`sem mudanças (${eventos.length} shows)`);
  else {
    await writeFile(caminho, depois);
    console.log(`agenda atualizada (${eventos.length} shows)`);
  }
}

principal().catch(err => {
  console.error(`erro: ${err.message}`);
  process.exitCode = 1;
});
