// ═══════════════════════════════════════════
//  SERVIA — Public Page Logic
//  public/public.js
// ═══════════════════════════════════════════

import {
  esc,
  getAvatarColor,
  initials,
  formatMoney,
  formatDate,
  formatDuracao,
  relativeTime,
  showToast,
  renderStars,
} from '../shared/lib/state.js';

import {
  ProfissionaisAPI,
  ServicosAPI,
  AvaliacoesAPI,
  AgendamentosAPI,
} from '../shared/lib/api.js';

// ── Referências DOM ──
const elements = {
  proGrid:            document.getElementById('pro-grid'),
  proCount:           document.getElementById('pro-count'),
  searchInput:        document.getElementById('search-input'),
  heroInput:          document.getElementById('hero-input'),
  espBar:             document.getElementById('esp-bar'),
  modalPerfil:        document.getElementById('modal-perfil'),
  perfilModalContent: document.getElementById('perfil-modal-content'),
};

// ── Estado ──
let filters = {
  especialidade:  'Todos',
  disponibilidade:'todos',
  order:          'rating',
  search:         '',
};
let profissionais  = [];
let selectedServicoId = null; // serviço selecionado no modal de perfil

// ──────────────────────────────────────────
// Carregamento de dados
// ──────────────────────────────────────────

async function loadData() {
  renderSkeletons();
  try {
    const result = await ProfissionaisAPI.list();
    if (!result.error && result.data) {
      profissionais = result.data;
      renderEspBar();
    } else {
      renderGridError();
      return;
    }
    renderGrid();
  } catch (err) {
    console.error('[Servia] Erro ao carregar profissionais:', err);
    renderGridError();
  }
}

async function loadServicos(proId) {
  const result = await ServicosAPI.listByPro(proId);
  return result.error ? [] : result.data;
}

async function loadAvaliacoes(proId) {
  const result = await AvaliacoesAPI.listByPro(proId);
  return result.error ? [] : result.data;
}

// ──────────────────────────────────────────
// Filtros e ordenação
// ──────────────────────────────────────────

function filteredProfissionais() {
  let list = [...profissionais];
  if (filters.especialidade !== 'Todos') {
    list = list.filter(p => p.especialidade === filters.especialidade);
  }
  if (filters.disponibilidade !== 'todos') {
    list = list.filter(p => p.disponibilidade === filters.disponibilidade);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.especialidade.toLowerCase().includes(q) ||
      (p.tags || []).join(' ').toLowerCase().includes(q)
    );
  }
  switch (filters.order) {
    case 'rating':     list.sort((a, b) => b.rating - a.rating);  break;
    case 'preco_asc':  list.sort((a, b) => a.preco  - b.preco);   break;
    case 'preco_desc': list.sort((a, b) => b.preco  - a.preco);   break;
  }
  return list;
}

// ──────────────────────────────────────────
// Renderização
// ──────────────────────────────────────────

/** Exibe esqueletos enquanto carrega */
function renderSkeletons(count = 6) {
  if (!elements.proGrid) return;
  elements.proGrid.innerHTML = Array.from({ length: count }).map(() => `
    <div class="pro-card pro-card--skeleton" aria-hidden="true">
      <div class="skeleton" style="height:76px"></div>
      <div class="pro-card-body" style="padding-top:2.5rem">
        <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:12px;width:40%;margin-bottom:16px"></div>
        <div class="skeleton" style="height:12px;width:80%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:36px;margin-top:1rem"></div>
      </div>
    </div>`).join('');
  if (elements.proCount) elements.proCount.textContent = 'Carregando…';
}

/** Estado de erro na grid */
function renderGridError() {
  if (!elements.proGrid) return;
  elements.proGrid.innerHTML = `
    <div class="empty-state pub-empty" style="grid-column:1/-1">
      <div class="empty-icon" aria-hidden="true">⚠️</div>
      <h3>Não foi possível carregar</h3>
      <p>Verifique sua conexão e tente novamente.</p>
      <button class="btn btn-primary" style="margin-top:1.25rem" onclick="loadData()">
        Tentar novamente
      </button>
    </div>`;
  if (elements.proCount) elements.proCount.textContent = '';
}

/** Barra de especialidades dinâmica */
function renderEspBar() {
  if (!elements.espBar) return;
  const espSet  = new Set(profissionais.map(p => p.especialidade));
  const esps    = ['Todos', ...espSet];
  // Preserva pills estáticas pré-existentes no HTML e adiciona as dinâmicas
  const dynamicPills = esps.map(esp => `
    <button class="esp-pill ${filters.especialidade === esp ? 'active' : ''}"
            data-action="setEsp" data-esp="${esc(esp)}"
            aria-pressed="${filters.especialidade === esp}">
      ${esc(esp)}
    </button>`).join('');

  // Substitui apenas o bloco dinâmico se existir, ou insere no final
  const dinamicContainer = elements.espBar.querySelector('#esp-dynamic');
  if (dinamicContainer) {
    dinamicContainer.innerHTML = dynamicPills;
  } else {
    const wrapper = document.createElement('div');
    wrapper.id = 'esp-dynamic';
    wrapper.style.cssText = 'display:contents';
    wrapper.innerHTML = dynamicPills;
    elements.espBar.appendChild(wrapper);
  }
}

/** Grid principal de profissionais */
function renderGrid() {
  const list = filteredProfissionais();

  if (elements.proCount) {
    elements.proCount.textContent =
      `${list.length} profissional${list.length !== 1 ? 'is' : ''}`;
  }
  if (!elements.proGrid) return;

  if (!list.length) {
    elements.proGrid.innerHTML = `
      <div class="empty-state pub-empty" style="grid-column:1/-1">
        <div class="empty-icon" aria-hidden="true">🔍</div>
        <h3>Nenhum profissional encontrado</h3>
        <p>Tente ajustar os filtros ou a busca.</p>
        <button class="btn btn-ghost" style="margin-top:1.25rem"
                onclick="clearFilters()">
          Limpar filtros
        </button>
      </div>`;
    return;
  }

  elements.proGrid.innerHTML = list.map(p => {
    const color = getAvatarColor(p.id);
    const disp  = p.disponibilidade === 'disponivel';

    // Suporte a avatar_url real
    const avatarInner = p.avatar_url
      ? `<img src="${esc(p.avatar_url)}" alt="${esc(p.nome)}" class="avatar-img">`
      : esc(initials(p.nome));

    return `
      <article class="pro-card" role="button" tabindex="0"
               data-action="openPerfil" data-id="${p.id}"
               aria-label="Ver perfil de ${esc(p.nome)}">
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
            <span class="badge ${disp ? 'badge-available' : 'badge-busy'}">
              ● ${disp ? 'Disponível' : 'Ocupado'}
            </span>
          </div>
          <div class="rating-row" style="margin-top:10px">
            <span class="stars" aria-label="${p.rating} estrelas">${renderStars(p.rating)}</span>
            <span class="rating-val">${p.rating}</span>
            <span>· ${p.total_agendamentos ?? 0} atendimentos</span>
          </div>
          <div class="pro-card-tags">
            ${(p.tags || []).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          <div class="pro-card-price">
            ${formatMoney(p.preco)} <small class="pro-card-price-label">/hora</small>
          </div>
          <div class="pro-card-actions">
            <button class="btn btn-primary" style="flex:1"
                    data-action="openPerfil" data-id="${p.id}"
                    tabindex="-1">
              Ver perfil
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ──────────────────────────────────────────
// Modal de Perfil
// ──────────────────────────────────────────

async function openPerfil(id) {
  const pro = profissionais.find(p => p.id === Number(id));
  if (!pro) return;

  // Mostra modal imediatamente com skeleton
  if (elements.modalPerfil) {
    elements.perfilModalContent.innerHTML = renderPerfilSkeleton();
    elements.modalPerfil.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Foco no modal para acessibilidade
    elements.modalPerfil.focus?.();
  }

  // Carrega dados em paralelo
  const [servicosPro, avaliacoesPro] = await Promise.all([
    loadServicos(id),
    loadAvaliacoes(id),
  ]);

  const color = getAvatarColor(pro.id);
  const disp  = pro.disponibilidade === 'disponivel';
  const avgRating = avaliacoesPro.length
    ? (avaliacoesPro.reduce((s, a) => s + a.nota, 0) / avaliacoesPro.length).toFixed(1)
    : pro.rating;

  selectedServicoId = null;

  const avatarInner = pro.avatar_url
    ? `<img src="${esc(pro.avatar_url)}" alt="${esc(pro.nome)}" class="avatar-img">`
    : esc(initials(pro.nome));

  // Seção de serviços
  const servicosHTML = servicosPro.length
    ? `<div class="servico-list">
        ${servicosPro.map(s => `
          <div class="servico-item" role="button" tabindex="0"
               data-action="selectServico" data-id="${s.id}"
               data-preco="${s.preco}" data-nome="${esc(s.nome)}"
               aria-pressed="false">
            <div class="servico-item-info">
              <div class="s-nome">${esc(s.nome)}</div>
              ${s.descricao  ? `<div class="s-desc">${esc(s.descricao)}</div>` : ''}
              ${s.duracao_min ? `<div class="s-desc">⏱ ${formatDuracao(s.duracao_min)}</div>` : ''}
            </div>
            <div class="servico-price">${formatMoney(s.preco)}</div>
          </div>`).join('')}
       </div>`
    : '<p class="perfil-no-data">Nenhum serviço cadastrado.</p>';

  // Seção de avaliações
  const avaliacoesHTML = avaliacoesPro.length
    ? avaliacoesPro.map(av => `
        <div class="avaliacao-card">
          <div class="avaliacao-header">
            <div class="avaliacao-author">${esc(av.cliente_nome)}</div>
            <div class="avaliacao-meta">
              <span class="stars" style="font-size:0.8rem"
                    aria-label="${av.nota} estrelas">${renderStars(av.nota)}</span>
              <span class="avaliacao-time">${relativeTime(av.created_at)}</span>
            </div>
          </div>
          <div class="avaliacao-text">${esc(av.comentario)}</div>
        </div>`).join('')
    : '<p class="perfil-no-data">Ainda sem avaliações.</p>';

  // Opções do select de serviço no formulário
  const svcOptions = servicosPro.length
    ? servicosPro.map(s =>
        `<option value="${s.id}" data-preco="${s.preco}" data-nome="${esc(s.nome)}">
           ${esc(s.nome)} — ${formatMoney(s.preco)}
         </option>`).join('')
    : '<option value="" disabled>Nenhum serviço disponível</option>';

  if (elements.perfilModalContent) {
    elements.perfilModalContent.innerHTML = `
      <div class="perfil-grid">

        <!-- Coluna esquerda: info + avaliações -->
        <div class="perfil-left">
          <div class="perfil-header">
            <div class="avatar avatar-xl" style="background:${color}" aria-hidden="true">
              ${avatarInner}
            </div>
            <div>
              <div class="perfil-name">${esc(pro.nome)}</div>
              <div class="perfil-esp">${esc(pro.especialidade)}</div>
              <div class="rating-row" style="margin-top:6px">
                <span class="stars" aria-label="${avgRating} estrelas">${renderStars(Number(avgRating))}</span>
                <span class="rating-val">${avgRating}</span>
                <span>· ${avaliacoesPro.length} avaliações</span>
              </div>
              <span class="badge ${disp ? 'badge-available' : 'badge-busy'}" style="margin-top:8px;display:inline-flex">
                ● ${disp ? 'Disponível' : 'Ocupado'}
              </span>
            </div>
          </div>

          <p class="perfil-bio">${esc(pro.bio)}</p>

          <div class="perfil-tags">
            ${(pro.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>

          <h4 class="perfil-section-title">Serviços</h4>
          ${servicosHTML}

          <h4 class="perfil-section-title" style="margin-top:1.5rem">Avaliações</h4>
          ${avaliacoesHTML}
        </div>

        <!-- Coluna direita: formulário de agendamento -->
        <div class="booking-panel-pub">
          <h3>Agendar com ${esc(pro.nome.split(' ')[0])}</h3>

          <div class="booking-field-pub">
            <label for="b-nome">Seu nome</label>
            <input id="b-nome" type="text" placeholder="Nome completo" autocomplete="name">
          </div>

          <div class="booking-field-pub">
            <label for="b-email">Email</label>
            <input id="b-email" type="email" placeholder="email@exemplo.com" autocomplete="email">
          </div>

          <div class="booking-field-pub">
            <label for="b-svc">Serviço</label>
            <select id="b-svc" aria-label="Selecionar serviço">
              <option value="">Selecione um serviço…</option>
              ${svcOptions}
            </select>
          </div>

          <div class="booking-field-pub">
            <label for="b-data">Data e hora</label>
            <input id="b-data" type="datetime-local">
          </div>

          <!-- Resumo dinâmico do serviço selecionado -->
          <div class="booking-summary" id="booking-summary" hidden>
            <div class="s-row"><span>Serviço</span><span id="bs-nome">—</span></div>
            <div class="s-row total"><span>Total</span><span id="bs-total">—</span></div>
          </div>

          <!-- Erro inline -->
          <div id="booking-pub-error" class="booking-error-pub" role="alert" aria-live="assertive" hidden></div>

          <button id="btn-booking-submit" class="btn btn-gold btn-full"
                  data-action="submitBooking" data-id="${pro.id}"
                  ${!servicosPro.length ? 'disabled' : ''}>
            Confirmar Agendamento
          </button>

          <p class="booking-disclaimer">
            Você receberá uma confirmação por email após o agendamento.
          </p>
        </div>
      </div>`;

    // Listener para atualizar resumo ao trocar serviço
    document.getElementById('b-svc')?.addEventListener('change', onSvcChange);
  }
}

/** Atualiza o painel de resumo quando o usuário seleciona um serviço */
function onSvcChange(e) {
  const sel     = e.target;
  const opt     = sel.options[sel.selectedIndex];
  const preco   = parseFloat(opt.dataset.preco) || 0;
  const nome    = opt.dataset.nome || '';
  const summary = document.getElementById('booking-summary');

  if (sel.value && summary) {
    document.getElementById('bs-nome').textContent  = nome;
    document.getElementById('bs-total').textContent = formatMoney(preco);
    summary.hidden = false;
  } else if (summary) {
    summary.hidden = true;
  }
}

function renderPerfilSkeleton() {
  return `
    <div class="perfil-grid" aria-hidden="true">
      <div class="perfil-left">
        <div class="perfil-header">
          <div class="skeleton" style="width:88px;height:88px;border-radius:50%;flex-shrink:0"></div>
          <div style="flex:1">
            <div class="skeleton" style="height:18px;width:55%;margin-bottom:8px"></div>
            <div class="skeleton" style="height:13px;width:40%"></div>
          </div>
        </div>
        <div class="skeleton" style="height:12px;width:100%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:12px;width:85%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:12px;width:70%;margin-bottom:1.5rem"></div>
        <div class="skeleton" style="height:56px;border-radius:8px;margin-bottom:8px"></div>
        <div class="skeleton" style="height:56px;border-radius:8px"></div>
      </div>
      <div class="skeleton" style="border-radius:16px;min-height:320px"></div>
    </div>`;
}

function closePerfil() {
  if (elements.modalPerfil) {
    elements.modalPerfil.classList.remove('open');
    document.body.style.overflow = '';
    selectedServicoId = null;
  }
}

// ──────────────────────────────────────────
// Ações
// ──────────────────────────────────────────

async function submitBooking(proId) {
  const nome     = document.getElementById('b-nome')?.value.trim();
  const email    = document.getElementById('b-email')?.value.trim();
  const svcSelect= document.getElementById('b-svc');
  const svcId    = svcSelect?.value;
  const data     = document.getElementById('b-data')?.value;
  const errEl    = document.getElementById('booking-pub-error');
  const btnEl    = document.getElementById('btn-booking-submit');

  // Validação com feedback inline
  if (!nome || !email || !svcId || !data) {
    showPubError(errEl, 'Preencha todos os campos antes de confirmar.');
    return;
  }
  if (!email.includes('@')) {
    showPubError(errEl, 'Informe um email válido.');
    return;
  }
  const dataHora = new Date(data);
  if (dataHora <= new Date()) {
    showPubError(errEl, 'Selecione uma data e hora no futuro.');
    return;
  }
  hidePubError(errEl);

  const selectedOption = svcSelect.options[svcSelect.selectedIndex];
  const servicoNome    = selectedOption.dataset.nome || selectedOption.textContent.split('—')[0].trim();

  // Estado de loading
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Enviando…'; }

  const result = await AgendamentosAPI.create({
    profissional_id: Number(proId),
    cliente_nome:    nome,
    cliente_email:   email,
    servico:         servicoNome,
    data_hora:       data,
  });

  if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Confirmar Agendamento'; }

  if (result.error) {
    showPubError(errEl, 'Erro ao agendar. Tente novamente.');
  } else {
    showConfirmacao(nome, servicoNome, data);
  }
}

/** Tela de confirmação pós-agendamento */
function showConfirmacao(nome, servico, dataStr) {
  const { full } = formatDate(dataStr);
  if (elements.perfilModalContent) {
    elements.perfilModalContent.innerHTML = `
      <div class="booking-confirm">
        <div class="check-icon" aria-hidden="true">✅</div>
        <h3>Agendamento confirmado!</h3>
        <p>Olá, <strong>${esc(nome)}</strong>! Seu agendamento de <strong>${esc(servico)}</strong>
           para <strong>${full}</strong> foi registrado.</p>
        <p style="margin-top:0.5rem">Você receberá uma confirmação no seu email em breve.</p>
        <button class="btn btn-primary" style="margin-top:1.5rem" onclick="closePerfil()">
          Fechar
        </button>
      </div>`;
  }
  showToast('Agendamento realizado!', 'success');
}

function showPubError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
function hidePubError(el) {
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
}

// ──────────────────────────────────────────
// Filtros
// ──────────────────────────────────────────

function setSearch(value) {
  filters.search = value;
  renderGrid();
}

function setEsp(esp) {
  filters.especialidade = esp;
  // Atualiza pills
  document.querySelectorAll('[data-action="setEsp"]').forEach(pill => {
    const isActive = pill.dataset.esp === esp;
    pill.classList.toggle('active', isActive);
    pill.setAttribute('aria-pressed', isActive);
  });
  renderGrid();
}

function setDisp(value) {
  filters.disponibilidade = value;
  renderGrid();
}

function setOrder(value) {
  filters.order = value;
  renderGrid();
}

function clearFilters() {
  filters = { especialidade: 'Todos', disponibilidade: 'todos', order: 'rating', search: '' };
  if (elements.searchInput) elements.searchInput.value = '';
  document.querySelectorAll('[data-action="setEsp"]').forEach(pill => {
    const isAll = pill.dataset.esp === 'Todos';
    pill.classList.toggle('active', isAll);
    pill.setAttribute('aria-pressed', isAll);
  });
  renderGrid();
}

function heroSearch() {
  const val = elements.heroInput?.value.trim();
  if (val) {
    setSearch(val);
    if (elements.searchInput) elements.searchInput.value = val;
    document.getElementById('profissionais')?.scrollIntoView({ behavior: 'smooth' });
  }
}

// ──────────────────────────────────────────
// Event Delegation
// ──────────────────────────────────────────

function handleAction(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const id     = target.dataset.id;

  switch (action) {
    case 'openPerfil':    if (id) openPerfil(id);         break;
    case 'submitBooking': if (id) submitBooking(id);       break;
    case 'heroSearch':    heroSearch();                    break;
    case 'closePerfil':   closePerfil();                   break;
    case 'setEsp':        setEsp(target.dataset.esp);      break;

    case 'selectServico': {
      // Destaca serviço selecionado e sincroniza com o select do formulário
      document.querySelectorAll('.servico-item').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-pressed', 'false');
      });
      target.classList.add('selected');
      target.setAttribute('aria-pressed', 'true');
      selectedServicoId = id;
      // Sincroniza com o <select> do booking form
      const bSvc = document.getElementById('b-svc');
      if (bSvc) {
        bSvc.value = id;
        bSvc.dispatchEvent(new Event('change'));
      }
      break;
    }
  }
}

// ──────────────────────────────────────────
// Inicialização
// ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  document.body.addEventListener('click', handleAction);

  // Teclado: Enter/Space em cards e servico-items (acessibilidade)
  document.body.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target.closest('[data-action]');
      if (target) { e.preventDefault(); handleAction(e); }
    }
  });

  // Input de busca principal
  document.body.addEventListener('input', e => {
    if (e.target.id === 'search-input') setSearch(e.target.value);
  });

  // Selects da filters-row no HTML (order e disponibilidade)
  document.body.addEventListener('change', e => {
    if (e.target.dataset.action === 'setOrder') setOrder(e.target.value);
    if (e.target.dataset.action === 'setDisp')  setDisp(e.target.value);
  });

  // Fechar modal no overlay ou tecla Escape
  if (elements.modalPerfil) {
    elements.modalPerfil.addEventListener('click', e => {
      if (e.target === elements.modalPerfil) closePerfil();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && elements.modalPerfil.classList.contains('open')) closePerfil();
    });
  }

  // Expor globalmente para compatibilidade com onclicks inline no HTML
  Object.assign(window, { closePerfil, heroSearch, setEsp, clearFilters, loadData });
});
