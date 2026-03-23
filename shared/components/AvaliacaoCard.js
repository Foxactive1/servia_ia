// ═══════════════════════════════════════════
//  SERVIA — AvaliacaoCard Component
//  shared/components/AvaliacaoCard.js
// ═══════════════════════════════════════════

import { esc, relativeTime, renderStars } from '../lib/state.js';

/**
 * Renderiza um card de avaliação.
 * @param {Object} av - avaliacao object
 */
export function AvaliacaoCard(av) {
  const time = relativeTime(av.created_at);

  return `
    <div class="avaliacao-card">
      <div class="avaliacao-header">
        <div class="avaliacao-author">${esc(av.cliente_nome)}</div>
        <div class="avaliacao-meta">
          <span class="stars" style="font-size:0.8rem"
                aria-label="${av.nota} estrelas">${renderStars(av.nota)}</span>
          <span class="avaliacao-time">${time}</span>
        </div>
      </div>
      <div class="avaliacao-text">${esc(av.comentario)}</div>
    </div>
  `;
}

/**
 * Picker de estrelas interativo.
 * Usa data-action em vez de onclick inline.
 * @param {number} value - nota atual (0–5)
 * @param {string} name  - identificador do campo
 */
export function StarPicker(value = 0, name = 'nota') {
  return `
    <div class="star-picker" id="star-picker-${esc(name)}"
         role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
      ${[1, 2, 3, 4, 5].map(n => `
        <button type="button"
                class="star-pick ${n <= value ? 'filled' : ''}"
                data-action="setStar"
                data-field="${esc(name)}"
                data-val="${n}"
                aria-label="${n} estrela${n > 1 ? 's' : ''}"
                aria-pressed="${n <= value}">★</button>
      `).join('')}
      <input type="hidden" id="input-${esc(name)}" name="${esc(name)}" value="${value}">
    </div>
  `;
}

/**
 * Handler para o StarPicker — chame via event delegation no pai:
 *   if (action === 'setStar') handleSetStar(target);
 */
export function handleSetStar(target) {
  const field = target.dataset.field;
  const val   = parseInt(target.dataset.val);
  const picker = document.getElementById(`star-picker-${field}`);
  if (!picker) return;

  // Atualiza visual e aria-pressed
  picker.querySelectorAll('.star-pick').forEach(btn => {
    const n = parseInt(btn.dataset.val);
    btn.classList.toggle('filled', n <= val);
    btn.setAttribute('aria-pressed', n <= val);
  });
  // Atualiza input hidden
  const input = document.getElementById(`input-${field}`);
  if (input) input.value = val;
}
