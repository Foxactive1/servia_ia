// ═══════════════════════════════════════════
//  SERVIA — API Layer
//  shared/lib/api.js
//  Abstrai fonte de dados (mock local ou Supabase)
// ═══════════════════════════════════════════

import { db } from './supabase.js';

const USE_MOCK = false; // altere para true para usar dados locais

// ──────────────────────────────────────────
// IMPLEMENTAÇÃO MOCK (dados locais)
// ──────────────────────────────────────────
let mockData = null;

const DEFAULT_MOCK = {
  profissionais: [
    {
      id: 1,
      nome: 'Ana Silva',
      especialidade: 'Designer UI/UX',
      bio: 'Especialista em design de interfaces e experiência do usuário.',
      preco: 180,
      rating: 4.9,
      tags: ['Figma', 'React', 'Branding'],
      disponibilidade: 'disponivel',
      total_agendamentos: 12
    },
    {
      id: 2,
      nome: 'Bruno Costa',
      especialidade: 'Desenvolvedor',
      bio: 'Full-stack developer especializado em Node.js, Python e cloud.',
      preco: 220,
      rating: 4.7,
      tags: ['Node.js', 'Python', 'AWS'],
      disponibilidade: 'ocupado',
      total_agendamentos: 8
    },
    {
      id: 3,
      nome: 'Carla Mendes',
      especialidade: 'Marketing',
      bio: 'Especialista em marketing digital e growth hacking.',
      preco: 150,
      rating: 4.8,
      tags: ['SEO', 'Google Ads', 'Social Media'],
      disponibilidade: 'disponivel',
      total_agendamentos: 5
    }
  ],
  servicos: [
    { id: 101, profissional_id: 1, nome: 'Design de Interface (UI)', descricao: 'Criação de layouts responsivos', duracao_min: 120, preco: 180 },
    { id: 102, profissional_id: 1, nome: 'Auditoria UX', descricao: 'Análise da experiência do usuário', duracao_min: 90, preco: 150 },
    { id: 201, profissional_id: 2, nome: 'Desenvolvimento API', descricao: 'Criação de APIs RESTful', duracao_min: 180, preco: 220 },
    { id: 301, profissional_id: 3, nome: 'Estratégia de Marketing', descricao: 'Plano completo de marketing digital', duracao_min: 150, preco: 150 }
  ],
  avaliacoes: [
    {
      id: 1,
      profissional_id: 1,
      profissional_nome: 'Ana Silva',
      cliente_nome: 'Rafael Gomes',
      nota: 5,
      comentario: 'Excelente profissional! Superou todas as expectativas.',
      created_at: new Date('2025-03-15').toISOString()
    },
    {
      id: 2,
      profissional_id: 2,
      profissional_nome: 'Bruno Costa',
      cliente_nome: 'Fernanda Reis',
      nota: 4,
      comentario: 'Muito bom, entregou no prazo.',
      created_at: new Date('2025-03-10').toISOString()
    }
  ],
  agendamentos: [
    {
      id: 1,
      profissional_id: 1,
      profissional_nome: 'Ana Silva',
      cliente_nome: 'Rafael Gomes',
      cliente_email: 'rafael@email.com',
      servico: 'Design de Interface (UI)',
      data_hora: new Date('2025-03-25T14:00:00').toISOString(),
      valor: 180,
      status: 'confirmed'
    },
    {
      id: 2,
      profissional_id: 2,
      profissional_nome: 'Bruno Costa',
      cliente_nome: 'Fernanda Reis',
      cliente_email: 'fernanda@email.com',
      servico: 'Desenvolvimento API',
      data_hora: new Date('2025-03-26T10:00:00').toISOString(),
      valor: 220,
      status: 'pending'
    }
  ]
};

let nextId = {
  profissional: 4,
  servico: 302,
  avaliacao: 3,
  agendamento: 3
};

async function loadMockData() {
  if (mockData) return mockData;
  mockData = JSON.parse(JSON.stringify(DEFAULT_MOCK));
  return mockData;
}

function delay(ms = 200) {
  return new Promise(r => setTimeout(r, ms));
}

const mockProfissionaisAPI = {
  async list(filters = {}) {
    await delay();
    const data = await loadMockData();
    let list = [...data.profissionais];
    if (filters.especialidade && filters.especialidade !== 'Todos') {
      list = list.filter(p => p.especialidade === filters.especialidade);
    }
    if (filters.disponibilidade && filters.disponibilidade !== 'todos') {
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
    return { data: list, error: null };
  },
  async get(id) {
    await delay();
    const data = await loadMockData();
    const pro = data.profissionais.find(p => p.id === Number(id));
    return { data: pro || null, error: pro ? null : 'Não encontrado' };
  },
  async create(payload) {
    await delay();
    const data = await loadMockData();
    const id = nextId.profissional++;
    const novo = { 
      id, 
      total_agendamentos: 0,
      rating: 5.0,
      ...payload 
    };
    data.profissionais.push(novo);
    return { data: novo, error: null };
  },
  async update(id, payload) {
    await delay();
    const data = await loadMockData();
    const idx = data.profissionais.findIndex(p => p.id === Number(id));
    if (idx === -1) return { data: null, error: 'Não encontrado' };
    data.profissionais[idx] = { ...data.profissionais[idx], ...payload };
    return { data: data.profissionais[idx], error: null };
  },
  async delete(id) {
    await delay();
    const data = await loadMockData();
    const idx = data.profissionais.findIndex(p => p.id === Number(id));
    if (idx === -1) return { error: 'Não encontrado' };
    data.profissionais.splice(idx, 1);
    return { error: null };
  }
};

const mockAgendamentosAPI = {
  async list(filters = {}) {
    await delay();
    const data = await loadMockData();
    let list = [...data.agendamentos];
    if (filters.profissional_id) {
      list = list.filter(a => a.profissional_id === Number(filters.profissional_id));
    }
    if (filters.status && filters.status !== 'todos') {
      list = list.filter(a => a.status === filters.status);
    }
    return { data: list, error: null };
  },
  async create(payload) {
    await delay();
    const data = await loadMockData();
    const id = nextId.agendamento++;
    const pro = data.profissionais.find(p => p.id === Number(payload.profissional_id));
    const novo = {
      id,
      status: 'pending',
      profissional_nome: pro?.nome ?? '',
      valor: pro?.preco ?? 0,
      ...payload
    };
    data.agendamentos.unshift(novo);
    if (pro) pro.total_agendamentos++;
    return { data: novo, error: null };
  },
  async updateStatus(id, status) {
    await delay();
    const data = await loadMockData();
    const idx = data.agendamentos.findIndex(a => a.id === Number(id));
    if (idx === -1) return { error: 'Não encontrado' };
    data.agendamentos[idx].status = status;
    return { data: data.agendamentos[idx], error: null };
  },
  async delete(id) {
    await delay();
    const data = await loadMockData();
    const idx = data.agendamentos.findIndex(a => a.id === Number(id));
    if (idx === -1) return { error: 'Não encontrado' };
    data.agendamentos.splice(idx, 1);
    return { error: null };
  }
};

const mockAvaliacoesAPI = {
  async listByPro(profissional_id) {
    await delay();
    const data = await loadMockData();
    let list = [...data.avaliacoes];
    if (profissional_id && profissional_id !== 0) {
      list = list.filter(a => a.profissional_id === Number(profissional_id));
    }
    return { data: list, error: null };
  },
  async create(payload) {
    await delay();
    const data = await loadMockData();
    const id = nextId.avaliacao++;
    const nova = { 
      id, 
      created_at: new Date().toISOString(), 
      ...payload 
    };
    data.avaliacoes.push(nova);
    const avs = data.avaliacoes.filter(a => a.profissional_id === payload.profissional_id);
    const media = avs.reduce((s, a) => s + a.nota, 0) / avs.length;
    const pro = data.profissionais.find(p => p.id === payload.profissional_id);
    if (pro) pro.rating = Math.round(media * 10) / 10;
    return { data: nova, error: null };
  },
  async delete(id) {
    await delay();
    const data = await loadMockData();
    const idx = data.avaliacoes.findIndex(a => a.id === Number(id));
    if (idx === -1) return { error: 'Não encontrado' };
    data.avaliacoes.splice(idx, 1);
    return { error: null };
  }
};

const mockServicosAPI = {
  async listByPro(profissional_id) {
    await delay();
    const data = await loadMockData();
    const servicos = data.servicos.filter(s => s.profissional_id === Number(profissional_id));
    return { data: servicos, error: null };
  },
  async create(payload) {
    await delay();
    const data = await loadMockData();
    const id = nextId.servico++;
    const novoServico = { id, ...payload };
    data.servicos.push(novoServico);
    return { data: novoServico, error: null };
  },
  async update(id, payload) {
    await delay();
    const data = await loadMockData();
    const idx = data.servicos.findIndex(s => s.id === Number(id));
    if (idx === -1) return { data: null, error: 'Não encontrado' };
    data.servicos[idx] = { ...data.servicos[idx], ...payload };
    return { data: data.servicos[idx], error: null };
  },
  async delete(id) {
    await delay();
    const data = await loadMockData();
    const idx = data.servicos.findIndex(s => s.id === Number(id));
    if (idx === -1) return { error: 'Não encontrado' };
    data.servicos.splice(idx, 1);
    return { error: null };
  }
};

const mockDashboardAPI = {
  async getStats() {
    await delay(100);
    const data = await loadMockData();
    const pros = data.profissionais;
    const ags = data.agendamentos;
    const avs = data.avaliacoes;
    return {
      data: {
        total_profissionais: pros.length,
        disponiveis: pros.filter(p => p.disponibilidade === 'disponivel').length,
        total_agendamentos: ags.length,
        confirmados: ags.filter(a => a.status === 'confirmed').length,
        pendentes: ags.filter(a => a.status === 'pending').length,
        cancelados: ags.filter(a => a.status === 'cancelled').length,
        receita_total: ags.filter(a => a.status !== 'cancelled').reduce((s, a) => s + (a.valor || 0), 0),
        total_avaliacoes: avs.length,
        rating_medio: avs.length ? (avs.reduce((s, a) => s + a.nota, 0) / avs.length).toFixed(1) : '—',
        por_profissional: pros.map(p => ({ nome: p.nome, total: p.total_agendamentos })).sort((a, b) => b.total - a.total)
      },
      error: null
    };
  }
};

// ──────────────────────────────────────────
// IMPLEMENTAÇÃO REAL (Supabase)
// ──────────────────────────────────────────
function handleResponse(response) {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return { data: null, error: response.error.message };
  }
  return { data: response.data, error: null };
}

const realProfissionaisAPI = {
  async list(filters = {}) {
    let query = db.from('profissionais').select('*');
    if (filters.especialidade && filters.especialidade !== 'Todos') {
      query = query.eq('especialidade', filters.especialidade);
    }
    if (filters.disponibilidade && filters.disponibilidade !== 'todos') {
      query = query.eq('disponibilidade', filters.disponibilidade);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      query = query.or(`nome.ilike.%${q}%,especialidade.ilike.%${q}%`);
    }
    const response = await query;
    return handleResponse(response);
  },
  async get(id) {
    const response = await db.from('profissionais').select('*').eq('id', Number(id)).single();
    return handleResponse(response);
  },
  async create(payload) {
    const response = await db.from('profissionais').insert([{
      nome: payload.nome,
      especialidade: payload.especialidade,
      bio: payload.bio || '',
      preco: payload.preco || 0,
      rating: payload.rating || 5.0,
      tags: payload.tags || [],
      disponibilidade: payload.disponibilidade || 'disponivel',
      total_agendamentos: 0,
    }]).select().single();
    return handleResponse(response);
  },
  async update(id, payload) {
    const response = await db.from('profissionais').update(payload).eq('id', Number(id)).select().single();
    return handleResponse(response);
  },
  async delete(id) {
    const response = await db.from('profissionais').delete().eq('id', Number(id));
    return handleResponse(response);
  }
};

const realAgendamentosAPI = {
  async list(filters = {}) {
    let query = db.from('agendamentos').select(`*, profissionais (nome)`);
    if (filters.profissional_id) {
      query = query.eq('profissional_id', Number(filters.profissional_id));
    }
    if (filters.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status);
    }
    const response = await query.order('data_hora', { ascending: false });
    if (response.error) return handleResponse(response);
    const transformed = response.data.map(item => ({
      ...item,
      profissional_nome: item.profissionais?.nome || 'Desconhecido',
      profissionais: undefined,
    }));
    return { data: transformed, error: null };
  },
  async create(payload) {
    const { data: pro, error: proError } = await db.from('profissionais').select('nome, preco').eq('id', Number(payload.profissional_id)).single();
    if (proError) return { data: null, error: 'Profissional não encontrado' };
    const agendamento = {
      profissional_id: payload.profissional_id,
      cliente_nome: payload.cliente_nome,
      cliente_email: payload.cliente_email,
      servico: payload.servico,
      data_hora: payload.data_hora,
      status: 'pending',
      valor: pro.preco,
    };
    const response = await db.from('agendamentos').insert([agendamento]).select().single();
    if (response.error) return handleResponse(response);
    const novo = { ...response.data, profissional_nome: pro.nome };
    return { data: novo, error: null };
  },
  async updateStatus(id, status) {
    const response = await db.from('agendamentos').update({ status }).eq('id', Number(id)).select().single();
    return handleResponse(response);
  },
  async delete(id) {
    const response = await db.from('agendamentos').delete().eq('id', Number(id));
    return handleResponse(response);
  }
};

const realAvaliacoesAPI = {
  async listByPro(profissional_id) {
    let query = db.from('avaliacoes').select(`*, profissionais (nome)`);
    if (profissional_id && profissional_id !== 0) {
      query = query.eq('profissional_id', Number(profissional_id));
    }
    const response = await query.order('created_at', { ascending: false });
    if (response.error) return handleResponse(response);
    const transformed = response.data.map(item => ({
      ...item,
      profissional_nome: item.profissionais?.nome || 'Desconhecido',
      profissionais: undefined,
    }));
    return { data: transformed, error: null };
  },
  async create(payload) {
    const response = await db.from('avaliacoes').insert([{
      profissional_id: payload.profissional_id,
      agendamento_id: payload.agendamento_id || null,
      cliente_nome: payload.cliente_nome,
      nota: payload.nota,
      comentario: payload.comentario,
    }]).select().single();
    return handleResponse(response);
  },
  async delete(id) {
    const response = await db.from('avaliacoes').delete().eq('id', Number(id));
    return handleResponse(response);
  }
};

const realServicosAPI = {
  async listByPro(profissional_id) {
    const response = await db.from('servicos').select('*').eq('profissional_id', Number(profissional_id));
    return handleResponse(response);
  },
  async create(payload) {
    const response = await db.from('servicos').insert([payload]).select().single();
    return handleResponse(response);
  },
  async update(id, payload) {
    const response = await db.from('servicos').update(payload).eq('id', Number(id)).select().single();
    return handleResponse(response);
  },
  async delete(id) {
    const response = await db.from('servicos').delete().eq('id', Number(id));
    return handleResponse(response);
  }
};

const realDashboardAPI = {
  async getStats() {
    try {
      const [profissionaisRes, agendamentosRes, avaliacoesRes] = await Promise.all([
        db.from('profissionais').select('*'),
        db.from('agendamentos').select('*'),
        db.from('avaliacoes').select('*'),
      ]);
      if (profissionaisRes.error || agendamentosRes.error || avaliacoesRes.error) {
        return { data: null, error: 'Erro ao carregar estatísticas' };
      }
      const pros = profissionaisRes.data;
      const ags = agendamentosRes.data;
      const avs = avaliacoesRes.data;
      const porProfissional = pros.map(pro => ({
        nome: pro.nome,
        total: ags.filter(a => a.profissional_id === pro.id).length,
      })).sort((a, b) => b.total - a.total);
      const receitaTotal = ags.filter(a => a.status !== 'cancelled').reduce((sum, a) => sum + (a.valor || 0), 0);
      const ratingMedio = avs.length ? (avs.reduce((sum, a) => sum + a.nota, 0) / avs.length).toFixed(1) : '—';
      const stats = {
        total_profissionais: pros.length,
        disponiveis: pros.filter(p => p.disponibilidade === 'disponivel').length,
        total_agendamentos: ags.length,
        confirmados: ags.filter(a => a.status === 'confirmed').length,
        pendentes: ags.filter(a => a.status === 'pending').length,
        cancelados: ags.filter(a => a.status === 'cancelled').length,
        receita_total: receitaTotal,
        total_avaliacoes: avs.length,
        rating_medio: ratingMedio,
        por_profissional: porProfissional,
      };
      return { data: stats, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
};

// ──────────────────────────────────────────
// EXPORTA A VERSÃO ESCOLHIDA
// ──────────────────────────────────────────
export const ProfissionaisAPI = USE_MOCK ? mockProfissionaisAPI : realProfissionaisAPI;
export const AgendamentosAPI  = USE_MOCK ? mockAgendamentosAPI  : realAgendamentosAPI;
export const AvaliacoesAPI   = USE_MOCK ? mockAvaliacoesAPI   : realAvaliacoesAPI;
export const ServicosAPI     = USE_MOCK ? mockServicosAPI     : realServicosAPI;
export const DashboardAPI    = USE_MOCK ? mockDashboardAPI    : realDashboardAPI;