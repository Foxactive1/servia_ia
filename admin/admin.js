// ═══════════════════════════════════════════
//  SERVIA — Admin Panel Logic
//  admin/admin.js
// ═══════════════════════════════════════════

import {
  esc,
  getAvatarColor,
  initials,
  formatMoney,
  formatDate,
  relativeTime,
  showToast,
  confirmDialog,
  renderStars,
  STATUS_LABEL,
  STATUS_BADGE,
} from '../shared/lib/state.js';

import {
  ProfissionaisAPI,
  AgendamentosAPI,
  AvaliacoesAPI,
  DashboardAPI,
} from '../shared/lib/api.js';

// ── Referências DOM ──
const elements = {
  viewDashboard:    document.getElementById('view-dashboard'),
  viewProfissionais:document.getElementById('view-profissionais'),
  viewAgenda:       document.getElementById('view-agenda'),
  viewAvaliacoes:   document.getElementById('view-avaliacoes'),
  proGrid:          document.getElementById('pro-grid'),
  agendaList:       document.getElementById('agenda-list'),
  avGrid:           document.getElementById('av-grid'),
  sbStats:          document.getElementById('sb-stats'),
  sbEsp:            document.getElementById('sb-esp'),
  sbStatus:         document.getElementById('sb-status'),
  sbDisp:           document.getElementById('sb-disp'),       // ← novo
  kpiGrid:          document.getElementById('kpi-grid'),
  dashBarChart:     document.getElementById('dash-bar-chart'),
  dashRecent:       document.getElementById('dash-recent'),
  proCountLbl:      document.getElementById('pro-count-lbl'),
  agendaCountLbl:   document.getElementById('agenda-count-lbl'),
  avCountLbl:       document.getElementById('av-count-lbl'),
  modalPro:         document.getElementById('modal-pro'),
  modalTitle:       document.getElementById('modal-title'),
  modalError:       document.getElementById('modal-error'),
  bookingError:     document.getElementById('booking-error'),
  bProSelect:       document.getElementById('b-pro-select'),
  btnSavePro:       document.getElementById('btn-save-pro'),
};

// ── Estado de UI ──
let filters = {
  view:          'dashboard',
  filterEsp:     'Todos',
  filterDisp:    'todos',
  filterStatus:  'todos',
  searchPro:     '',
  searchAgenda:  '',
};

// ── Dados em cache ──
let profissionais = [];
let agendamentos  = [];
let avaliacoes    = [];

// ── Títulos das views (para document.title) ──
const VIEW_TITLES = {
  dashboard:      'Visão Geral',
  profissionais:  'Profissionais',
  agenda:         'Agenda',
  avaliacoes:     'Avaliações',
};

// ──────────────────────────────────────────
// Carregamento de dados
// ──────────────────────────────────────────
async function loadData() {
  const [proRes, agRes, avRes, statsRes] = await Promise.all([
    ProfissionaisAPI.list(),
    AgendamentosAPI.list(),
    AvaliacoesAPI.listByPro(0),
    DashboardAPI.getStats(),
  ]);
  if (!proRes.error)   profissionais = proRes.data;
  if (!agRes.error)    agendamentos  = agRes.data;
  if (!avRes.error)    avaliacoes    = avRes.data;
  return statsRes.data;
}

// ──────────────────────────────────────────
// Renderização
// ──────────────────────────────────────────
async function renderAll() {
  const stats = await loadData();
  renderSidebar(stats);
  renderDashboard(stats);
  renderProfissionais();
  renderAgenda();
  renderAvaliacoes();
}

function renderSidebar(stats) {
  // Mini estatísticas
  if (elements.sbStats) {
    elements.sbStats.innerHTML = `
      <div class="stat-mini"><div class="stat-mini-val">${stats.total_profissionais}</div><div class="stat-mini-lbl">Profissionais</div></div>
      <div class="stat-mini"><div class="stat-mini-val">${stats.disponiveis}</div><div class="stat-mini-lbl">Disponíveis</div></div>
      <div class="stat-mini"><div class="stat-mini-val">${stats.total_agendamentos}</div><div class="stat-mini-lbl">Agendamentos</div></div>
      <div class="stat-mini"><div class="stat-mini-val">${stats.pendentes}</div><div class="stat-mini-lbl">Pendentes</div></div>`;
  }

  // Filtro de especialidades
  if (elements.sbEsp) {
    const espSet = new Set(profissionais.map(p => p.especialidade));
    const esps = ['Todos', ...espSet];
    elements.sbEsp.innerHTML = esps.map(esp => {
      const count = esp === 'Todos'
        ? profissionais.length
        : profissionais.filter(p => p.especialidade === esp).length;
      return `<div class="sidebar-filter ${filters.filterEsp === esp ? 'active' : ''}"
                   data-action="setFilterEsp" data-esp="${esc(esp)}"
                   role="button" tabindex="0" aria-pressed="${filters.filterEsp === esp}">
                <span>${esc(esp)}</span>
                <span class="sf-count">${count}</span>
              </div>`;
    }).join('');
  }

  // Filtro de status de agendamentos
  if (elements.sbStatus) {
    const statuses = ['todos', 'pending', 'confirmed', 'completed', 'cancelled'];
    const labels   = { todos:'Todos', pending:'Pendentes', confirmed:'Confirmados', completed:'Concluídos', cancelled:'Cancelados' };
    elements.sbStatus.innerHTML = statuses.map(s => {
      const count = s === 'todos' ? agendamentos.length : agendamentos.filter(a => a.status === s).length;
      return `<div class="sidebar-filter ${filters.filterStatus === s ? 'active' : ''}"
                   data-action="setFilterStatus" data-status="${s}"
                   role="button" tabindex="0" aria-pressed="${filters.filterStatus === s}">
                <span>${labels[s]}</span>
                <span class="sf-count">${count}</span>
              </div>`;
    }).join('');
  }

  // Filtro de disponibilidade — agora gerado pelo JS, sem onclick inline no HTML
  if (elements.sbDisp) {
    const opts = [
      { value: 'todos',     label: 'Todos' },
      { value: 'disponivel',label: 'Disponíveis' },
      { value: 'ocupado',   label: 'Ocupados' },
    ];
    elements.sbDisp.innerHTML = opts.map(o => `
      <div class="sidebar-filter ${filters.filterDisp === o.value ? 'active' : ''}"
           data-action="setFilterDisp" data-disp="${o.value}"
           role="button" tabindex="0" aria-pressed="${filters.filterDisp === o.value}">
        <span>${o.label}</span>
      </div>`).join('');
  }
}

function renderDashboard(stats) {
  if (!elements.kpiGrid) return;

  elements.kpiGrid.innerHTML = `
    <div class="kpi-card gold">
      <div class="kpi-icon" aria-hidden="true">👥</div>
      <div class="kpi-val">${stats.total_profissionais}</div>
      <div class="kpi-lbl">Profissionais</div>
      <div class="kpi-change up">↑ ${stats.disponiveis} disponíveis</div>
    </div>
    <div class="kpi-card sage">
      <div class="kpi-icon" aria-hidden="true">📅</div>
      <div class="kpi-val">${stats.total_agendamentos}</div>
      <div class="kpi-lbl">Agendamentos</div>
      <div class="kpi-change ${stats.pendentes ? 'up' : ''}">
        ↑ ${stats.pendentes} pendente${stats.pendentes !== 1 ? 's' : ''}
      </div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-icon" aria-hidden="true">💰</div>
      <div class="kpi-val">${formatMoney(stats.receita_total)}</div>
      <div class="kpi-lbl">Receita total</div>
      <div class="kpi-change up">↑ cancelados excluídos</div>
    </div>
    <div class="kpi-card rust">
      <div class="kpi-icon" aria-hidden="true">⭐</div>
      <div class="kpi-val">${stats.rating_medio}</div>
      <div class="kpi-lbl">Rating médio</div>
      <div class="kpi-change up">↑ ${stats.total_avaliacoes} avaliações</div>
    </div>`;

  // Bar chart — corrigido: usa índice estável para getAvatarColor
  if (elements.dashBarChart) {
    const max = stats.por_profissional[0]?.total || 1;
    elements.dashBarChart.innerHTML = stats.por_profissional.slice(0, 6).map((p, i) => {
      const width = (p.total / max) * 100;
      const color = getAvatarColor(i);           // ← índice estável em vez de p.nome.length
      return `<div class="bar-row">
        <div class="bar-label">${esc(p.nome.split(' ')[0])}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%;background:${color}" role="progressbar"
               aria-valuenow="${p.total}" aria-valuemin="0" aria-valuemax="${max}"></div>
        </div>
        <div class="bar-val">${p.total}</div>
      </div>`;
    }).join('');
  }

  // Atividade recente
  if (elements.dashRecent) {
    elements.dashRecent.innerHTML = agendamentos.slice(0, 5).map(a => {
      const pro = profissionais.find(p => p.id === a.profissional_id);
      const color = getAvatarColor(pro?.id || 0);
      const { day, month, time } = formatDate(a.data_hora);
      return `<div class="recent-item">
        <div class="avatar avatar-sm" style="background:${color}" aria-hidden="true">${esc(initials(a.profissional_nome))}</div>
        <div class="recent-info">
          <div class="recent-name">${esc(a.cliente_nome)}</div>
          <div class="recent-sub">${esc(a.profissional_nome)} · ${day}/${month} ${time}</div>
        </div>
        <span class="badge ${STATUS_BADGE[a.status]}">${STATUS_LABEL[a.status]}</span>
      </div>`;
    }).join('');
  }
}

function filteredProfissionais() {
  let list = [...profissionais];
  if (filters.filterEsp !== 'Todos')   list = list.filter(p => p.especialidade === filters.filterEsp);
  if (filters.filterDisp !== 'todos')  list = list.filter(p => p.disponibilidade === filters.filterDisp);
  if (filters.searchPro) {
    const q = filters.searchPro.toLowerCase();
    list = list.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.especialidade.toLowerCase().includes(q) ||
      (p.tags || []).join(' ').toLowerCase().includes(q)
    );
  }
  return list;
}

function renderProfissionais() {
  const list = filteredProfissionais();
  if (elements.proCountLbl) {
    elements.proCountLbl.textContent =
      `${list.length} profissional${list.length !== 1 ? 'is' : ''} encontrado${list.length !== 1 ? 's' : ''}`;
  }
  if (!elements.proGrid) return;

  if (!list.length) {
    elements.proGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon" aria-hidden="true">🔍</div>
        <h3>Nenhum resultado</h3>
        <p>Tente outros filtros.</p>
      </div>`;
    return;
  }

  elements.proGrid.innerHTML = list.map(p => {
    const color = getAvatarColor(p.id);
    const disp  = p.disponibilidade === 'disponivel';
    // Suporte a avatar_url: se existir, exibe <img>; caso contrário, iniciais
    const avatarInner = p.avatar_url
      ? `<img src="${esc(p.avatar_url)}" alt="${esc(p.nome)}" class="avatar-img">`
      : esc(initials(p.nome));

    return `
      <article class="pro-card" data-pro-id="${p.id}">
        <div class="pro-card-cover" style="background:${color}20">
          <div class="avatar avatar-lg pro-card-avatar" style="background:${color}" aria-label="${esc(p.nome)}">
            ${avatarInner}
          </div>
        </div>
        <div class="pro-card-body">
          <div class="pro-card-toprow">
            <div>
              <div class="pro-card-name">${esc(p.nome)}</div>
              <div class="pro-card-esp">${esc(p.especialidade)}</div>
            </div>
            <span class="badge ${disp ? 'badge-available' : 'badge-busy'}">
              ● ${disp ? 'Disponível' : 'Ocupado'}
            </span>
          </div>
          <div class="rating-row" style="margin-top:8px">
            <span class="stars" aria-label="${p.rating} estrelas">${renderStars(p.rating)}</span>
            <span class="rating-val">${p.rating}</span>
            <span>· ${p.total_agendamentos} atendimentos</span>
          </div>
          <div class="pro-card-tags">
            ${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          <div class="pro-card-price">${formatMoney(p.preco)} <small class="pro-card-price-label">/hora</small></div>
          <div class="pro-card-actions">
            <button class="btn btn-primary" style="flex:1" data-action="agendarPro" data-id="${p.id}">Agendar</button>
            <button class="btn btn-ghost btn-sm" data-action="editPro"    data-id="${p.id}" aria-label="Editar ${esc(p.nome)}">✏</button>
            <button class="btn btn-danger btn-sm" data-action="deletePro" data-id="${p.id}" aria-label="Excluir ${esc(p.nome)}">🗑</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

function filteredAgendamentos() {
  let list = [...agendamentos];
  if (filters.filterStatus !== 'todos') list = list.filter(a => a.status === filters.filterStatus);
  if (filters.searchAgenda) {
    const q = filters.searchAgenda.toLowerCase();
    list = list.filter(a =>
      a.cliente_nome.toLowerCase().includes(q) ||
      a.profissional_nome.toLowerCase().includes(q)
    );
  }
  return list;
}

function renderAgenda() {
  if (elements.bProSelect) {
    elements.bProSelect.innerHTML = '<option value="">Selecione…</option>' +
      profissionais.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('');
  }

  const list = filteredAgendamentos();
  if (elements.agendaCountLbl) {
    elements.agendaCountLbl.textContent =
      `${list.length} agendamento${list.length !== 1 ? 's' : ''} encontrado${list.length !== 1 ? 's' : ''}`;
  }
  if (!elements.agendaList) return;

  if (!list.length) {
    elements.agendaList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">📅</div>
        <h3>Nenhum agendamento</h3>
        <p>Tente outros filtros.</p>
      </div>`;
    return;
  }

  elements.agendaList.innerHTML = list.map(a => {
    const color = getAvatarColor(a.profissional_id);
    const { day, month, time } = formatDate(a.data_hora);
    return `
      <div class="agenda-card">
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
          <div class="agenda-time">🕐 ${time} · ${esc(a.cliente_email)}</div>
        </div>
        <div class="agenda-valor">${formatMoney(a.valor)}</div>
        <div class="agenda-actions">
          <select class="status-select" data-action="updateStatus" data-id="${a.id}"
                  aria-label="Status do agendamento de ${esc(a.cliente_nome)}">
            ${['pending','confirmed','completed','cancelled'].map(s =>
              `<option value="${s}" ${a.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`
            ).join('')}
          </select>
          <button class="btn btn-danger btn-sm" data-action="deleteAgendamento" data-id="${a.id}"
                  aria-label="Excluir agendamento de ${esc(a.cliente_nome)}">🗑</button>
        </div>
      </div>`;
  }).join('');
}

function renderAvaliacoes() {
  const list = avaliacoes;
  const avgOverall = list.length
    ? (list.reduce((s, a) => s + a.nota, 0) / list.length).toFixed(1)
    : '—';
  if (elements.avCountLbl) {
    elements.avCountLbl.textContent =
      `${list.length} avaliação${list.length !== 1 ? 'ões' : ''} · Média geral: ${avgOverall}⭐`;
  }
  if (!elements.avGrid) return;

  if (!list.length) {
    elements.avGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon" aria-hidden="true">⭐</div>
        <h3>Nenhuma avaliação</h3>
        <p>As avaliações aparecerão aqui.</p>
      </div>`;
    return;
  }

  elements.avGrid.innerHTML = list.map(av => {
    const color = getAvatarColor(av.profissional_id);
    return `
      <div class="av-card">
        <div class="av-card-header">
          <div class="avatar avatar-sm" style="background:${color}" aria-hidden="true">
            ${esc(initials(av.profissional_nome))}
          </div>
          <div class="av-card-info">
            <div class="av-card-pro">${esc(av.profissional_nome)}</div>
            <div class="av-card-client">por ${esc(av.cliente_nome)}</div>
          </div>
          <span class="stars" aria-label="${av.nota} estrelas">${renderStars(av.nota)}</span>
        </div>
        <div class="av-card-text">${esc(av.comentario)}</div>
        <div class="av-card-footer">
          <span>${new Date(av.created_at).toLocaleDateString('pt-BR')}</span>
          <button class="btn btn-danger btn-sm" data-action="deleteAvaliacao" data-id="${av.id}"
                  aria-label="Excluir avaliação de ${esc(av.cliente_nome)}">🗑</button>
        </div>
      </div>`;
  }).join('');
}

// ──────────────────────────────────────────
// CRUD — Profissionais
// ──────────────────────────────────────────
let editingProId = null;

function openModal(id = null) {
  editingProId = null;
  elements.modalTitle.textContent = 'Novo Profissional';
  document.getElementById('m-nome').value   = '';
  document.getElementById('m-esp').value    = '';
  document.getElementById('m-bio').value    = '';
  document.getElementById('m-preco').value  = '';
  document.getElementById('m-rating').value = '';
  document.getElementById('m-tags').value   = '';
  document.getElementById('m-avatar').value = '';
  document.getElementById('m-disp').value   = 'disponivel';
  hideError(elements.modalError);
  elements.modalPro.classList.add('open');
  // Foco no primeiro campo para acessibilidade
  setTimeout(() => document.getElementById('m-nome')?.focus(), 50);
}

function editPro(id) {
  const pro = profissionais.find(p => p.id === id);
  if (!pro) return;
  editingProId = id;
  elements.modalTitle.textContent = 'Editar Profissional';
  document.getElementById('m-nome').value   = pro.nome;
  document.getElementById('m-esp').value    = pro.especialidade;
  document.getElementById('m-bio').value    = pro.bio || '';
  document.getElementById('m-preco').value  = pro.preco;
  document.getElementById('m-rating').value = pro.rating;
  document.getElementById('m-tags').value   = (pro.tags || []).join(', ');
  document.getElementById('m-avatar').value = pro.avatar_url || '';
  document.getElementById('m-disp').value   = pro.disponibilidade;
  hideError(elements.modalError);
  elements.modalPro.classList.add('open');
  setTimeout(() => document.getElementById('m-nome')?.focus(), 50);
}

function closeModal() {
  elements.modalPro.classList.remove('open');
}

async function savePro() {
  const nome   = document.getElementById('m-nome').value.trim();
  const esp    = document.getElementById('m-esp').value.trim();
  const bio    = document.getElementById('m-bio').value.trim();
  const preco  = parseFloat(document.getElementById('m-preco').value) || 0;
  const rating = parseFloat(document.getElementById('m-rating').value) || 5;
  const tags   = document.getElementById('m-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const avatar = document.getElementById('m-avatar').value.trim();
  const disp   = document.getElementById('m-disp').value;

  if (!nome || !esp) {
    showError(elements.modalError, 'Nome e especialidade são obrigatórios.');
    return;
  }

  // Estado de loading no botão
  setButtonLoading(elements.btnSavePro, true, 'Salvando…');

  const payload = { nome, especialidade: esp, bio, preco, rating, tags, disponibilidade: disp };
  if (avatar) payload.avatar_url = avatar;

  let result;
  if (editingProId) {
    result = await ProfissionaisAPI.update(editingProId, payload);
  } else {
    result = await ProfissionaisAPI.create(payload);
  }

  setButtonLoading(elements.btnSavePro, false, 'Salvar Profissional');

  if (result.error) {
    showError(elements.modalError, 'Erro ao salvar profissional. Tente novamente.');
    return;
  }

  showToast(`${nome} ${editingProId ? 'atualizado' : 'cadastrado'}!`, 'success');
  closeModal();
  await renderAll();
}

async function deletePro(id) {
  const pro = profissionais.find(p => p.id === id);
  if (!pro) return;
  const ok = await confirmDialog(`Deseja excluir o profissional "${pro.nome}"?\nEsta ação não pode ser desfeita.`);
  if (!ok) return;
  const result = await ProfissionaisAPI.delete(id);
  if (result.error) { showToast('Erro ao excluir', 'error'); return; }
  showToast(`${pro.nome} removido`, 'info');
  await renderAll();
}

function agendarPro(id) {
  navigate('agenda');
  setTimeout(() => {
    if (elements.bProSelect) elements.bProSelect.value = id;
    showToast(`Agendando com ${profissionais.find(p => p.id === id)?.nome}…`, 'info');
  }, 100);
}

// ──────────────────────────────────────────
// CRUD — Agendamentos
// ──────────────────────────────────────────
async function addAgendamento() {
  const cliente = document.getElementById('b-cliente').value.trim();
  const email   = document.getElementById('b-email').value.trim();
  const proId   = parseInt(document.getElementById('b-pro-select').value);
  const servico = document.getElementById('b-servico').value.trim();
  const data    = document.getElementById('b-data').value;

  if (!cliente || !proId || !servico || !data) {
    showError(elements.bookingError, 'Preencha todos os campos antes de continuar.');
    return;
  }
  hideError(elements.bookingError);

  const result = await AgendamentosAPI.create({
    profissional_id: proId,
    cliente_nome:    cliente,
    cliente_email:   email,
    servico,
    data_hora:       data,
  });

  if (result.error) {
    showError(elements.bookingError, 'Erro ao criar agendamento. Tente novamente.');
    return;
  }

  // Limpar formulário
  ['b-cliente','b-email','b-servico','b-data'].forEach(id => {
    document.getElementById(id).value = '';
  });
  if (elements.bProSelect) elements.bProSelect.value = '';

  showToast('Agendamento criado!', 'success');
  await renderAll();
}

async function updateStatus(id, status) {
  const result = await AgendamentosAPI.updateStatus(id, status);
  if (result.error) { showToast('Erro ao atualizar status', 'error'); return; }
  // Atualiza cache local sem re-fetch completo para evitar piscar a lista
  const idx = agendamentos.findIndex(a => a.id === id);
  if (idx !== -1) agendamentos[idx].status = status;
  renderAgenda();
}

async function deleteAgendamento(id) {
  const a = agendamentos.find(a => a.id === id);
  if (!a) return;
  const ok = await confirmDialog(`Cancelar o agendamento de "${a.cliente_nome}"?`);
  if (!ok) return;
  const result = await AgendamentosAPI.delete(id);
  if (result.error) { showToast('Erro ao excluir', 'error'); return; }
  showToast('Agendamento removido', 'info');
  await renderAll();
}

// ──────────────────────────────────────────
// CRUD — Avaliações
// ──────────────────────────────────────────
async function deleteAvaliacao(id) {
  const ok = await confirmDialog('Remover esta avaliação permanentemente?');
  if (!ok) return;
  const result = await AvaliacoesAPI.delete(id);
  if (result.error) { showToast('Erro ao remover avaliação', 'error'); return; }
  showToast('Avaliação removida', 'info');
  await renderAll();
}

// ──────────────────────────────────────────
// Navegação
// ──────────────────────────────────────────
function navigate(view) {
  filters.view = view;

  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');

  // Atualiza nav buttons com aria-current
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    const isActive = btn.textContent.trim() === VIEW_TITLES[view];
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Atualiza o título da aba do browser
  document.title = `Servia Admin — ${VIEW_TITLES[view] ?? view}`;

  renderAll();
}

// ──────────────────────────────────────────
// Filtros
// ──────────────────────────────────────────
function setFilterEsp(esp) {
  filters.filterEsp = esp;
  renderProfissionais();
  // Atualiza aria-pressed na sidebar
  elements.sbEsp?.querySelectorAll('[data-action="setFilterEsp"]').forEach(el => {
    el.setAttribute('aria-pressed', el.dataset.esp === esp);
    el.classList.toggle('active', el.dataset.esp === esp);
  });
}

function setFilterStatus(status) {
  filters.filterStatus = status;
  renderAgenda();
  elements.sbStatus?.querySelectorAll('[data-action="setFilterStatus"]').forEach(el => {
    el.setAttribute('aria-pressed', el.dataset.status === status);
    el.classList.toggle('active', el.dataset.status === status);
  });
}

function setFilterDisp(disp) {
  filters.filterDisp = disp;
  renderProfissionais();
  elements.sbDisp?.querySelectorAll('[data-action="setFilterDisp"]').forEach(el => {
    el.setAttribute('aria-pressed', el.dataset.disp === disp);
    el.classList.toggle('active', el.dataset.disp === disp);
  });
  // Sincroniza o <select> do header da view Profissionais
  const sel = document.querySelector('.filter-select');
  if (sel) sel.value = disp;
}

function searchPro(value) {
  filters.searchPro = value.toLowerCase();
  renderProfissionais();
}

function searchAgenda(value) {
  filters.searchAgenda = value.toLowerCase();
  renderAgenda();
}

// ──────────────────────────────────────────
// Helpers de UI
// ──────────────────────────────────────────
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function hideError(el) {
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
}

function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = label;
}

// ──────────────────────────────────────────
// Event Delegation (click + change)
// ──────────────────────────────────────────
function handleAction(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.getAttribute('data-action');
  const id     = target.getAttribute('data-id');
  const esp    = target.getAttribute('data-esp');
  const status = target.getAttribute('data-status');
  const disp   = target.getAttribute('data-disp');

  switch (action) {
    case 'setFilterEsp':    if (esp)    setFilterEsp(esp);         break;
    case 'setFilterStatus': if (status) setFilterStatus(status);   break;
    case 'setFilterDisp':   if (disp)   setFilterDisp(disp);       break;
    case 'agendarPro':      if (id)     agendarPro(parseInt(id));  break;
    case 'editPro':         if (id)     editPro(parseInt(id));     break;
    case 'deletePro':       if (id)     deletePro(parseInt(id));   break;
    case 'deleteAgendamento': if (id)   deleteAgendamento(parseInt(id)); break;
    case 'deleteAvaliacao':   if (id)   deleteAvaliacao(parseInt(id));   break;
  }
}

// ──────────────────────────────────────────
// Inicialização
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await renderAll();

  document.body.addEventListener('click', handleAction);

  // Teclado: Enter/Space em sidebar-filters (acessibilidade)
  document.body.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target.closest('[data-action]');
      if (target) { e.preventDefault(); handleAction(e); }
    }
  });

  document.body.addEventListener('change', e => {
    const target = e.target.closest('[data-action="updateStatus"]');
    if (target) {
      updateStatus(parseInt(target.getAttribute('data-id')), target.value);
    }
  });

  if (elements.modalPro) {
    elements.modalPro.addEventListener('click', e => {
      if (e.target === elements.modalPro) closeModal();
    });
    // Fechar modal com Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && elements.modalPro.classList.contains('open')) closeModal();
    });
  }

  // Expor funções globais para os onclick no HTML (compatibilidade)
  Object.assign(window, {
    navigate, openModal, closeModal, savePro,
    addAgendamento, searchPro, searchAgenda,
    setFilterDisp, editPro, deletePro,
    updateStatus, deleteAgendamento, deleteAvaliacao,
  });
});
