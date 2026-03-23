# Servia — Plataforma de Serviços Profissionais

> Marketplace de serviços com vitrine pública e painel admin. Backend Supabase.

---

## 📁 Estrutura de Arquivos

```
servia/
│
├ ← Vitrine pública (clientes)
│   ├── index.html               ← Página principal
│   ├── public.css               ← Estilos da vitrine
│   └── public.js                ← Lógica da vitrine
│
├── admin/                       ← Painel administrativo
│   ├── index.html               ← Dashboard admin
│   ├── admin.css                ← Estilos do admin
│   └── admin.js                 ← Lógica do admin
│
├── shared/
│   ├── styles/
│   │   ├── tokens.css           ← Design tokens (cores, fonts, vars CSS)
│   │   └── components.css       ← Componentes visuais compartilhados
│   │
│   ├── lib/
│   │   ├── supabase.js          ← Cliente Supabase (configurar credenciais)
│   │   ├── api.js               ← Camada de dados (mock ↔ Supabase)
│   │   └── state.js             ← Helpers, mock data, constantes
│   │
│   └── components/
│       ├── ProfissionalCard.js  ← Card reutilizável de profissional
│       ├── AgendamentoCard.js   ← Card reutilizável de agendamento
│       └── AvaliacaoCard.js     ← Card + StarPicker de avaliação
│
└── supabase_schema.sql          ← Schema completo para o Supabase
```

---

## 🚀 Como rodar

### Modo demo (sem backend)
Abra diretamente no browser:
- Vitrine: `public/index.html`
- Admin: `admin/index.html`

Os dados mock já estão incluídos em `shared/lib/state.js`.

### Com servidor local (recomendado)
```bash
# Python
python3 -m http.server 3000

# Node
npx serve .
```

---

## ☁️ Conectar ao Supabase

### 1. Criar projeto
Acesse [supabase.com](https://supabase.com) → New Project

### 2. Executar o schema
Em **SQL Editor**, execute o arquivo `supabase_schema.sql`

### 3. Configurar credenciais
Em `shared/lib/supabase.js`:
```js
const SUPABASE_URL    = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY';
```

### 4. Ativar dados reais
Em `shared/lib/api.js`, linha 10:
```js
const USE_MOCK = false;  // ← mudar para false
```

### 5. Incluir o SDK
Adicione antes dos seus scripts:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 🗄️ Modelo de dados

| Tabela          | Descrição                                        |
|-----------------|--------------------------------------------------|
| `profissionais` | Cadastro dos profissionais                       |
| `servicos`      | Serviços ofertados por profissional              |
| `agendamentos`  | Agendamentos dos clientes                        |
| `avaliacoes`    | Reviews com nota e comentário                    |

### Fluxo de dados
```
Cliente (vitrine)                Admin
     │                              │
     ├─ Lista profissionais ────────┤
     ├─ Abre perfil                 ├─ CRUD profissionais
     ├─ Seleciona serviço           ├─ Gerencia agendamentos
     ├─ Preenche form               ├─ Atualiza status
     ├─ Cria agendamento ──────────►├─ Dashboard métricas
     └─ Deixa avaliação             └─ Modera avaliações
```

---

## 🎨 Design System

Todas as variáveis CSS estão em `shared/styles/tokens.css`:

```css
--gold:   #c9a84c   /* Destaque, CTAs principais */
--ink:    #0f0e0d   /* Texto principal, fundo nav */
--paper:  #f5f2ed   /* Background geral */
--sage:   #5a7a62   /* Sucesso, disponível */
--rust:   #c0572b   /* Erro, cancelado */
--blue:   #2c4a7c   /* Informação */
```

Fontes: **Playfair Display** (títulos) + **DM Sans** (corpo)

---

## 📌 Features implementadas

### Vitrine Pública
- [x] Hero com busca e cards de destaque
- [x] Barra de filtro por especialidade
- [x] Grid de profissionais com filtros e ordenação
- [x] Modal de perfil completo
- [x] Listagem de serviços com seleção
- [x] Formulário de agendamento com resumo
- [x] Confirmação de agendamento
- [x] Listagem de avaliações
- [x] Formulário para deixar avaliação com star picker
- [x] Seção "Como funciona"
- [x] Depoimentos
- [x] Link para o painel admin

### Painel Admin
- [x] Dashboard com KPIs e gráficos
- [x] CRUD completo de profissionais (modal)
- [x] Agenda com filtros e busca
- [x] Atualização de status de agendamentos (inline)
- [x] Criação de agendamentos
- [x] Listagem e moderação de avaliações
- [x] Sidebar com filtros e estatísticas
- [x] Link para a vitrine pública

### Shared
- [x] Design tokens unificados
- [x] Componentes CSS reutilizáveis
- [x] Camada de API com toggle mock/Supabase
- [x] Helpers de formatação e estado
- [x] Sistema de toasts

---

## 🔜 Próximos passos sugeridos

- [ ] Autenticação admin com Supabase Auth
- [ ] Upload de foto de perfil (Supabase Storage)
- [ ] Notificações por email (Supabase Edge Functions + Resend)
- [ ] Calendário visual na agenda
- [ ] Página de confirmação de agendamento por link único
- [ ] PWA (offline + instalação mobile)
- [ ] Painel do profissional (área de login própria)
