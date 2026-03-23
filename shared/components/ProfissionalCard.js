// ═══════════════════════════════════════════
//  SERVIA — ProfissionalCard Component
//  shared/components/ProfissionalCard.js
// ═══════════════════════════════════════════

import { esc, getAvatarColor, initials, renderStars, formatMoney } from '../lib/state.js';

/**
 * @param {Object}  p         - profissional object
 * @param {number}  index     - for avatar color cycling
 * @param {Object}  opts
 * @param {boolean} opts.admin  - shows edit/delete actions via data-action
 * @param {boolean} opts.public - shows "Ver perfil" CTA
 */
export function ProfissionalCard(p, index = 0, opts = {}) {
  const color  = getAvatarColor(index);
  const disp   = p.disponibilidade === 'disponivel';
  const tags   = (p.tags || []).slice(0, 3);
  const preco  = formatMoney(p.preco);

  // Suporte a avatar_url real
  const avatarInner = p.avatar_url
    ? `<img src="${esc(p.avatar_url)}" alt="${esc(p.nome)}" class="avatar-img">`
    : esc(initials(p.nome));

  const dispBadge = disp
    ? `<span class="badge badge-available">● Disponível</span>`
    : `<span class="badge badge-busy">● Ocupado</span>`;

  // data-action em vez de onclick inline → seguro e testável
  const adminActions = opts.admin ? `
    <button class="btn btn-ghost btn-sm"
            data-action="editPro" data-id="${p.id}"
            aria-label="Editar ${esc(p.nome)}">✏</button>
    <button class="btn btn-danger btn-sm"
            data-action="deletePro" data-id="${p.id}"
            aria-label="Excluir ${esc(p.nome)}">🗑</button>
  ` : '';

  const ctaAction = opts.admin ? 'agendarPro' : 'openPerfil';
  const ctaLabel  = opts.admin ? 'Agendar'    : 'Ver perfil';

  const agendarBtn = (opts.public || opts.admin) ? `
    <button class="btn btn-primary" style="flex:1"
            data-action="${ctaAction}" data-id="${p.id}">
      ${ctaLabel}
    </button>
  ` : '';

  return `
    <article class="pro-card" data-action="${opts.public ? 'openPerfil' : ''}"
             data-id="${p.id}" role="${opts.public ? 'button' : 'article'}"
             ${opts.public ? `tabindex="0" aria-label="Ver perfil de ${esc(p.nome)}"` : ''}>
      <div class="pro-card-cover" style="background:${color}20">
        <div class="avatar avatar-lg pro-card-avatar" style="background:${color}" aria-hidden="true">
          ${avatarInner}
        </div>
      </div>
      <div class="pro-card-body">
        <div class="pro-card-toprow">
          <div>
            <div class="pro-card-name">${esc(p.nome)}</div>
            <div class="pro-card-esp">${esc(p.especialidade)}</div>
          </div>
          ${dispBadge}
        </div>
        <div class="rating-row" style="margin-top:10px">
          <span class="stars" aria-label="${p.rating} estrelas">${renderStars(p.rating)}</span>
          <span class="rating-val">${p.rating}</span>
          <span>· ${p.total_agendamentos ?? 0} atendimentos</span>
        </div>
        <div class="pro-card-tags">
          ${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
        <div class="pro-card-price">
          ${preco} <small class="pro-card-price-label">/hora</small>
        </div>
        <div class="pro-card-actions">
          ${agendarBtn}
          ${adminActions}
        </div>
      </div>
    </article>
  `;
}
