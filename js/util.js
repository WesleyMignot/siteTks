// Funções puras (sem DOM): testadas com node --test.

const formatoPOA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Hora de Porto Alegre no formato "HH:MM". */
export function horaPOA(data) {
  return formatoPOA.format(data);
}
