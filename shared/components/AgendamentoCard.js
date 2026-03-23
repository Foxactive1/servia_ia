// ═══════════════════════════════════════════
//  SERVIA — AgendamentoCard Component
//  shared/components/AgendamentoCard.js
// ═══════════════════════════════════════════

import {
  esc,
  getAvatarColor,
  initials,
  formatDate,
  formatMoney,
  STATUS_LABEL,
  STATUS_BADGE,
} from '../lib/state.js';

/**
 * @param {Object}  a           - agendamento
 * @param {number}  proIdx      - índice do profissional para cor
 * @param {Object}  opts
 * @param {boolean} opts.admin      - exibe select de status + botão excluir
 * @param {boolean} opts.showValor  - exibe coluna de valor
 */
export function AgendamentoCard(a, proIdx = 0, opts = {}) {
  const color = getAvatarColor(proIdx);
  const { day, month, time } = formatDate(a.data_hora);
  const badge = STATUS_BADGE[a.status] ?? 'badge-pending';
  const label = STATUS_LABEL[a.status] ?? a.status;

  // data-action em vez de onchange/onclick inline
  const statusActions = opts.admin
    ? `<select class="status-select"
               data-action="updateStatus" data-id="${a.id}"
               aria-label="Status do agendamento de ${esc(a.cliente_nome)}">
         ${['pending', 'confirmed', 'completed', 'cancelled'].map(s =>
           `<option value="${s}" ${a.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`
         ).join('')}
       </select>`
    : `<span class="badge ${badge}">${label}</span>`;

  const deleteBtn = opts.admin
    ? `<button class="btn btn-danger btn-sm"
               data-action="deleteAgendamento" data-id="${a.id}"
               aria-label="Excluir agendamento de ${esc(a.cliente_nome)}">🗑</button>`
    : '';

  const valorCol = opts.showValor
    ? `<div class="agenda-valor">${formatMoney(a.valor)}</div>`
    : '';

  return `
    <div class="agenda-card" data-id="${a.id}">
      <div class="agenda-date-block" aria-label="${day} de ${month}">
        <div class="agenda-day">${day}</div>
        <div class="agenda-month">${month}</div>
      </div>
      <div class="avatar avatar-sm" style="background:${color}" aria-hidden="true">
        ${esc(initials(a.profissional_nome))}
      </div>
      <div class="agenda-info">
        <div class="agenda-client">${esc(a.cliente_nome)}</div>
        <div class="agenda-pro">${esc(a.profissional_nome)} · ${esc(a.servico)}</div>
        <div class="agenda-time">🕐 ${time}</div>
      </div>
      ${valorCol}
      <div class="agenda-actions">
        ${statusActions}
        ${deleteBtn}
      </div>
    </div>
  `;
}
