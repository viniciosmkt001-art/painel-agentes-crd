-- Corrige o RAG do agente IPAM: cria a tabela "documents" que faltava (usada pelo node
-- vectorStoreSupabase do n8n) e a função match_documents que ele chama pra buscar contexto.
-- Rodar uma vez no SQL Editor do Supabase (projeto wmdywbchukmzyqgluxps).
-- Não afeta contatos_agente, fontes_conhecimento nem nenhuma outra tabela existente.

create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(1536)
);

create index if not exists idx_documents_metadata on documents using gin (metadata);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
