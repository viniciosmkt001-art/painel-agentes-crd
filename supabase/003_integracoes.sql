-- Tabela de credenciais de integração por agente (Chatwoot, RD Station, WhatsApp/Evolution API).
-- Rodar uma vez no SQL Editor do Supabase (projeto wmdywbchukmzyqgluxps).
-- Agentes existentes (IPAM/AMAGIS/ASMEGO) continuam usando credenciais estáticas no n8n;
-- esta tabela é consultada dinamicamente só pelos agentes novos, criados via clonagem no painel.

create table if not exists integracoes (
  id uuid primary key default gen_random_uuid(),
  agente_id uuid not null references agentes(id) on delete cascade,
  tipo text not null check (tipo in ('chatwoot', 'rd_station', 'whatsapp')),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (agente_id, tipo)
);

create index if not exists idx_integracoes_agente on integracoes(agente_id);
