// Robô da agenda (rodada 5): lê os próximos shows do Brunin no Ayon, grava os flyers em assets/agenda/ e reescreve o
// bloco da seção #agenda no index.html (entre <!-- agenda:inicio --> e <!-- agenda:fim -->).
// Roda a cada 6 h no GitHub Actions (.github/workflows/agenda.yml) e também à mão:  node tools/agenda.mjs
// Em erro (Ayon fora do ar, formato mudou, Ayon sem shows enquanto o site ainda tem shows por vir), sai com código 1
// sem gravar nada: o site fica como estava. Para esvaziar a agenda de propósito: AGENDA_PERMITIR_VAZIA=1.
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  lerJsonLd, lerPerfil, lerEvento, limparLine, proximos, renderizarAgenda, trocarBloco, esvaziamentoSuspeito, nomeDoFlyer,
} from './agenda-dados.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PERFIL = 'https://useayon.com/djbrunintks';
const UA = 'siteTks-agenda (+https://wesleymignot.github.io/siteTks/)';
const PASTA = join(RAIZ, 'assets', 'agenda');
const INDEX = join(RAIZ, 'index.html');
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

async function principal() {
  const agora = new Date();
  const htmlAtual = await readFile(INDEX, 'utf8');

  // 1. perfil (se falhar aqui, nada foi gravado) e a trava contra apagar a agenda por mudança de formato
  const futuros = proximos(lerPerfil(lerJsonLd(await buscar(PERFIL))), agora);
  if (esvaziamentoSuspeito(htmlAtual, futuros, agora) && process.env.AGENDA_PERMITIR_VAZIA !== '1') {
    throw new Error('o Ayon não trouxe nenhum show, mas a agenda no ar ainda tem shows por vir — formato mudou? '
      + 'Se a agenda deve mesmo esvaziar, rode com AGENDA_PERMITIR_VAZIA=1 (no GitHub: Run workflow com "permitir_vazia").');
  }

  // 2. cada show: ingresso e line-up (falha → link do Ayon, sem line-up) e flyer (só baixa o que ainda não tem)
  await mkdir(PASTA, { recursive: true });
  const existentes = new Set((await readdir(PASTA)).filter(f => f.endsWith('.jpg')));
  const novos = new Map(); // arquivo → bytes, gravados só no fim
  const eventos = [];
  for (const e of futuros) {
    let detalhes = { ingresso: null, line: [] };
    try { detalhes = lerEvento(lerJsonLd(await buscar(e.pagina))); } catch (err) { console.warn(`aviso: ${e.slug}: página do show (${err.message})`); }
    let flyer = null;
    if (e.imagem) {
      const arquivo = nomeDoFlyer(e.slug, e.imagem); // o nome muda quando o Ayon troca a imagem
      if (existentes.has(arquivo)) flyer = `assets/agenda/${arquivo}`;
      else {
        try {
          novos.set(arquivo, await reduzir(await buscar(e.imagem, true)));
          flyer = `assets/agenda/${arquivo}`;
        } catch (err) { console.warn(`aviso: ${e.slug}: flyer (${err.message})`); }
      }
    }
    eventos.push({ ...e, ingresso: detalhes.ingresso, line: limparLine(detalhes.line), flyer });
    console.log(`${e.inicio.slice(0, 16).replace('T', ' ')}  ${e.nome}${flyer ? '' : '  (sem flyer)'}${detalhes.ingresso ? '' : '  (sem ingresso)'}`);
  }

  // 3. página nova calculada antes de mexer no disco (trocarBloco lança erro sem os marcadores)
  const htmlNovo = trocarBloco(htmlAtual, renderizarAgenda(eventos));

  // 4. grava: flyers novos, apaga os de shows que saíram (ou trocaram de imagem), index.html só se mudou
  for (const [arquivo, bytes] of novos) await writeFile(join(PASTA, arquivo), bytes);
  const usados = new Set(eventos.filter(e => e.flyer).map(e => e.flyer.split('/').pop()));
  for (const f of existentes) if (!usados.has(f)) await unlink(join(PASTA, f));
  if (htmlNovo === htmlAtual) console.log(`sem mudanças (${eventos.length} shows)`);
  else {
    await writeFile(INDEX, htmlNovo);
    console.log(`agenda atualizada (${eventos.length} shows)`);
  }
}

principal().catch(err => {
  console.error(`erro: ${err.message}`);
  process.exitCode = 1;
});
