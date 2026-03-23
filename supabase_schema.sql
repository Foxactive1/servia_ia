-- ═══════════════════════════════════════════
--  SERVIA — Supabase Schema
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════

-- 1. Profissionais
create table profissionais (
  id                  bigserial primary key,
  nome                text not null,
  especialidade       text not null,
  bio                 text,
  preco               numeric(10,2) not null default 0,
  rating              numeric(3,1)  not null default 5.0,
  tags                text[]        not null default '{}',
  disponibilidade     text          not null default 'disponivel' check (disponibilidade in ('disponivel','ocupado')),
  avatar_url          text,
  total_agendamentos  integer       not null default 0,
  created_at          timestamptz   not null default now()
);

-- 2. Serviços por profissional
create table servicos (
  id               bigserial primary key,
  profissional_id  bigint references profissionais(id) on delete cascade,
  nome             text    not null,
  descricao        text,
  duracao_min      integer not null default 60,
  preco            numeric(10,2) not null,
  ativo            boolean not null default true,
  created_at       timestamptz not null default now()
);

-- 3. Agendamentos
create table agendamentos (
  id               bigserial primary key,
  profissional_id  bigint references profissionais(id) on delete set null,
  servico_id       bigint references servicos(id) on delete set null,
  cliente_nome     text not null,
  cliente_email    text not null,
  cliente_tel      text,
  servico          text not null,  -- nome snapshot
  data_hora        timestamptz not null,
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','completed','cancelled')),
  valor            numeric(10,2) not null default 0,
  notas            text,
  created_at       timestamptz not null default now()
);

-- 4. Avaliações
create table avaliacoes (
  id               bigserial primary key,
  profissional_id  bigint references profissionais(id) on delete cascade,
  agendamento_id   bigint references agendamentos(id) on delete set null,
  cliente_nome     text not null,
  nota             integer not null check (nota between 1 and 5),
  comentario       text not null,
  created_at       timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────
create index on agendamentos(profissional_id);
create index on agendamentos(status);
create index on agendamentos(data_hora);
create index on avaliacoes(profissional_id);
create index on servicos(profissional_id);

-- ── Trigger: recalcular rating após nova avaliação ──
create or replace function update_rating()
returns trigger as $$
begin
  update profissionais
  set rating = (
    select round(avg(nota)::numeric, 1)
    from avaliacoes
    where profissional_id = new.profissional_id
  )
  where id = new.profissional_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_rating
after insert or update on avaliacoes
for each row execute procedure update_rating();

-- ── Trigger: incrementar total_agendamentos ──
create or replace function inc_agendamentos()
returns trigger as $$
begin
  if new.status = 'confirmed' and (old is null or old.status <> 'confirmed') then
    update profissionais set total_agendamentos = total_agendamentos + 1
    where id = new.profissional_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_inc_agendamentos
after insert or update on agendamentos
for each row execute procedure inc_agendamentos();

-- ── Row Level Security (RLS) ──────────────
alter table profissionais enable row level security;
alter table agendamentos   enable row level security;
alter table avaliacoes     enable row level security;
alter table servicos       enable row level security;

-- Público pode ler profissionais e avaliações
create policy "public read profissionais" on profissionais for select using (true);
create policy "public read avaliacoes"    on avaliacoes    for select using (true);
create policy "public read servicos"      on servicos      for select using (ativo = true);

-- Público pode inserir agendamentos e avaliações
create policy "public insert agendamentos" on agendamentos for insert with check (true);
create policy "public insert avaliacoes"   on avaliacoes   for insert with check (true);

-- Admin (service_role) pode tudo — já incluso por padrão no Supabase

-- ── Dados iniciais (opcional) ─────────────
insert into profissionais (nome, especialidade, bio, preco, rating, tags, disponibilidade) values
  ('Ana Silva',     'Designer UI/UX', 'Especialista em design de produto e UX com 8 anos de experiência.', 180, 4.9, '{"Figma","React","Branding"}',  'disponivel'),
  ('Bruno Costa',   'Desenvolvedor',  'Full-stack developer, Node.js e AWS.',                               220, 4.7, '{"Node.js","Python","AWS"}',     'ocupado'),
  ('Carla Mendes',  'Marketing',      'Growth hacker e estrategista digital.',                              140, 4.8, '{"SEO","ADS","CRO"}',            'disponivel'),
  ('Diego Alves',   'Fotógrafo',      'Fotógrafo premiado, produto e retratos.',                            250, 5.0, '{"Produto","Retrato","Vídeo"}',  'disponivel'),
  ('Henrique Dias', 'Consultoria',    'Consultor de negócios com 15+ anos.',                                300, 4.9, '{"OKR","Estratégia","PMO"}',     'disponivel');
