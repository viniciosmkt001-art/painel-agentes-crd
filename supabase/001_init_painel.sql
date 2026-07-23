-- Painel de Gestão de Agentes de IA — tabelas novas, isoladas das tabelas do n8n.
-- Rodar uma vez no SQL Editor do Supabase (projeto wmdywbchukmzyqgluxps).
-- Não altera nenhuma tabela existente (contatos_agente, contatos_agente_duplicateipam,
-- follow_up, documents, cotacoesipam).

create extension if not exists pgcrypto;

create table if not exists panel_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists agentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  associacao text not null,
  ativo boolean not null default true,
  tom_personalidade text not null default 'profissional',
  tamanho_resposta text not null default 'medio' check (tamanho_resposta in ('curto', 'medio', 'longo')),
  prompt_base text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fontes_conhecimento (
  id uuid primary key default gen_random_uuid(),
  agente_id uuid not null references agentes(id) on delete cascade,
  tipo text not null check (tipo in ('faq', 'site', 'pagina_unica', 'documento', 'youtube', 'audio')),
  titulo text not null,
  conteudo text,
  url text,
  arquivo_path text,
  status text not null default 'pendente' check (status in ('pendente', 'processando', 'pronto', 'erro')),
  erro_detalhe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gatilhos (
  id uuid primary key default gen_random_uuid(),
  agente_id uuid not null references agentes(id) on delete cascade,
  intencao text not null,
  acao_tipo text not null,
  acao_config jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_fontes_conhecimento_agente on fontes_conhecimento(agente_id);
create index if not exists idx_gatilhos_agente on gatilhos(agente_id);

-- Seed do agente IPAM (piloto), referenciando o mesmo nome usado no workflow n8n "Luis Beta - IPAM".
insert into agentes (nome, associacao, prompt_base)
values ('Luis Beta - IPAM', 'IPAM', '')
on conflict do nothing;
