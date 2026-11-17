// Agenda (rodada 5): o robô (tools/agenda.mjs) grava os próximos shows no index.html a cada 6 h. Aqui só escondemos
// os que já acabaram nesse intervalo; se não sobrar nenhum, aparece o "Agenda aberta". Roda em qualquer modo.
import { passou } from './util.js';

export function iniciarAgenda(agora = new Date()) {
  const cartoes = document.querySelector('.agenda__cartoes');
  const vazia = document.querySelector('.agenda__vazia');
  if (!cartoes || !vazia) return; // sem shows o robô já grava só o "Agenda aberta"
  const eventos = [...cartoes.querySelectorAll('.evento[data-fim]')];
  for (const e of eventos) if (passou(e.dataset.fim, agora)) e.hidden = true;
  if (eventos.every(e => e.hidden)) {
    cartoes.hidden = true;
    vazia.hidden = false;
  }
}
