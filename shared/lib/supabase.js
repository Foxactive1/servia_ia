// ═══════════════════════════════════════════
//  SERVIA — Supabase Client
//  shared/lib/supabase.js
// ═══════════════════════════════════════════

// ⚠️  Substitua com suas credenciais do Supabase
//    Dashboard → Project Settings → API
const SUPABASE_URL = 'https://gxtmxxbrmimdrkmjonnb.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dG14eGJybWltZHJrbWpvbm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzg3OTgsImV4cCI6MjA4OTYxNDc5OH0.q8pY4Ga9F11o7X2v00m9k4wcbT12CMkwp8gI38niWcM';

// Inicializa o cliente Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Tabelas de referência ──────────────────
// profissionais    → id, nome, especialidade, bio, preco, rating, tags[], disponibilidade, avatar_url, total_agendamentos, created_at
// agendamentos     → id, profissional_id, cliente_nome, cliente_email, cliente_tel, servico, data_hora, status, valor, notas, created_at
// avaliacoes       → id, profissional_id, agendamento_id, cliente_nome, nota, comentario, created_at
// servicos         → id, profissional_id, nome, descricao, duracao_min, preco

export { db };
