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
