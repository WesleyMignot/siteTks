// Funções puras (sem DOM): testadas com node --test.

const formatoPOA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Hora de Porto Alegre no formato "HH:MM". */
export function horaPOA(data) {
  return formatoPOA.format(data);
}

/** Versão do vídeo do hero conforme a largura da tela (> 820px = desktop). */
export function escolherHero(largura) {
  return largura > 820 ? 'assets/video/hero-720.mp4' : 'assets/video/hero-540.mp4';
}

/** Valor de contador arredondado; com `milhar`, usa o separador pt-BR (2.000). */
export function formatarContagem(valor, { milhar = false } = {}) {
  const n = Math.round(valor);
  return milhar ? n.toLocaleString('pt-BR') : String(n);
}

/** Gerador pseudoaleatório determinístico (mulberry32): mesma semente, mesma sequência em [0,1). */
export function criarRng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
