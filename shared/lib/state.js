// ═══════════════════════════════════════════
//  SERVIA — State & Helpers
//  shared/lib/state.js
//  FONTE ÚNICA DE VERDADE — não duplique em outros arquivos
// ═══════════════════════════════════════════

// ── Utilitário de escape para prevenir XSS ──
export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Avatar colors ──
const AVATAR_COLORS = [
  '#2c4a7c', '#c9a84c', '#c0572b', '#5a7a62',
  '#7c4a6e', '#4a7c7a', '#7c6a2c', '#2c6a7c',
];

export function getAvatarColor(id) {
  const hash = (id * 131) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export function initials(nome) {
  if (!nome) return '?';
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Date helpers ──
export function formatDate(dt) {
  const d = new Date(dt);
  return {
    day:   d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('pt-BR', { month: 'short' }),
    year:  d.getFullYear(),
    time:  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    full:  d.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }),
    iso:   d.toISOString(),
  };
}

export function relativeTime(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)} dias`;
}

export function formatDuracao(min) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return (h ? `${h}h` : '') + (m ? `${m}min` : '');
}

// ── Rating ──
export function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Money ──
export function formatMoney(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val ?? 0);
}

// ── Status maps (exportados) ──
export const STATUS_LABEL = {
  confirmed: 'Confirmado',
  pending:   'Pendente',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

export const STATUS_BADGE = {
  confirmed: 'badge-confirmed',
  pending:   'badge-pending',
  cancelled: 'badge-cancelled',
  completed: 'badge-gold',
};

export const DISP_LABEL = {
  disponivel: 'Disponível',
  ocupado:    'Ocupado',
};

// ── Toast singleton ──
export function showToast(msg, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.innerHTML = `<span style="font-weight:700">${icons[type] ?? '·'}</span> ${esc(msg)}`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Confirm dialog (promise-based) ──
export function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.style.cssText = 'z-index:9999';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:380px;padding:2rem;text-align:center">
        <p style="font-size:1rem;margin-bottom:1.5rem;line-height:1.5">${esc(msg)}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button id="confirm-cancel" class="btn btn-ghost">Cancelar</button>
          <button id="confirm-ok"     class="btn btn-danger">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector('#confirm-ok').addEventListener('click', () => close(true));
    overlay.querySelector('#confirm-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
  });
}