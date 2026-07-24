# Painel de Gestão de Agentes de IA — CRD Seguros

## Objetivo do projeto

A CRD Seguros já usa agentes de IA no WhatsApp (via n8n) pra atender clientes de várias
associações (IPAM, AMAGIS, ASMEGO, e futuramente outras). O problema: qualquer ajuste no
agente — trocar personalidade, adicionar conhecimento novo, configurar um gatilho — exigia
editar o workflow do n8n diretamente, nó por nó.

Esse painel nasceu de uma reunião com a RD Station sobre o produto "RD Conversas" (que
oferece um painel de configuração pra IA de atendimento). Em vez de migrar pra RD Conversas
(perderia flexibilidade do RAG customizado e o investimento já feito no n8n), a decisão foi
**construir o mesmo tipo de painel de gestão em cima da infraestrutura que já existe**
(n8n + Supabase), sem trocar de plataforma.

**Objetivo final**: qualquer pessoa da equipe (não só quem mexe em n8n) consegue configurar
personalidade, base de conhecimento, gatilhos e integrações de um agente, sem precisar abrir
o editor visual do n8n.

## Arquitetura

```
Painel (Next.js, este repo)  →  Supabase (config + RAG)  →  n8n (motor de execução)  →  WhatsApp/Chatwoot
```

- **O painel nunca fala com WhatsApp nem processa IA.** Ele só lê/escreve configuração no
  Supabase.
- **O n8n continua sendo o motor.** Os workflows de cada associação (agentes de WhatsApp já
  existentes: "Luis Beta - IPAM", "Luis Beta - AMAGIS", "Luis Beta - ASMEGO") leem essa
  configuração em tempo de execução.
- **IPAM, AMAGIS e ASMEGO compartilham o mesmo projeto Supabase** (não é um banco por
  associação). Por isso o isolamento entre agentes é feito por um campo `agente_id` no
  metadata dos dados, não por bancos separados.

### Por que isso é seguro (não quebra o que já funciona)

Todas as tabelas novas (`agentes`, `fontes_conhecimento`, `gatilhos`, `panel_users`,
`integracoes`) são **aditivas** — vivem ao lado das tabelas que o n8n já usava
(`contatos_agente`, `follow_up`, `cotacoes`, `documents`), sem alterar nada nelas.

## O que existe hoje

### Painel (esta aplicação)

- **Login com papéis**: `admin` (tudo, inclusive usuários e integrações) e `editor`
  (agentes/conhecimento/gatilhos, sem gestão de usuários/credenciais)
- **Lista de agentes**: hoje IPAM, AMAGIS e ASMEGO
- **Detalhe do agente** (abas):
  - *Personalidade*: tom, tamanho de resposta, prompt base
  - *Base de Conhecimento*: 6 tipos — Perguntas e Respostas, Documentos (upload real),
    Sites, Páginas Únicas, YouTube, Áudio (upload real, mas **YouTube e Áudio ainda não são
    processados** — ver "Limitações conhecidas")
  - *Gatilhos*: intenção → ação (ex: "candidato_vaga" → enviar link e desqualificar),
    conectado de verdade ao agente via uma tool no n8n
  - *Integrações* (admin only): credenciais de Chatwoot/RD Station/WhatsApp por agente —
    hoje só **informativo** pros 3 agentes existentes (eles continuam usando credenciais
    estáticas no n8n); serve pra agentes novos que vierem a ser criados

### No n8n (produção, VPS `31.97.85.196`)

- **Workflow "Processador de Conhecimento"** (`VYHZmHQocqLYFkud`): recebe o que o painel
  manda (FAQ, site, página única, documento), extrai o texto, gera embedding (OpenAI
  `text-embedding-3-small`) e grava na tabela `documents` do Supabase com
  `metadata.agente_id` e `metadata.fonte_id`.
- **Workflow "Executar Gatilho"** (`vWUPc7eG4dV8TUsZ`): sub-workflow anexado como tool ao
  agente principal (`RECEPCIONISTA`) dos 3 agentes. Recebe `{agenteId, intencao}`, consulta a
  tabela `gatilhos` e devolve a ação configurada pro agente seguir.

## Schema do Supabase (tabelas do painel)

Projeto compartilhado: `wmdywbchukmzyqgluxps.supabase.co`. SQL de criação em `supabase/*.sql`
(rodar em ordem no SQL Editor do Supabase se for recriar do zero).

| Tabela | Papel |
|---|---|
| `panel_users` | usuários do painel (email, hash de senha, papel) |
| `agentes` | um agente por associação (nome, tom, tamanho de resposta, prompt) |
| `fontes_conhecimento` | fontes de conhecimento por agente (tipo, conteúdo/url, status) |
| `gatilhos` | intenção → ação por agente |
| `integracoes` | credenciais de Chatwoot/RD Station/WhatsApp por agente (jsonb) |

Tabelas que **já existiam** e o painel só lê/referencia, nunca altera o schema:
`contatos_agente`, `contatos_agente_duplicateipam`, `follow_up`, `cotacoes`, `cotacoesipam`,
`documents` (a tabela de vetores do RAG).

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher com os valores reais (pedir pro time)
npm run dev                   # http://localhost:3000
npm run seed:admin            # cria/atualiza o usuário admin definido em .env.local
```

Variáveis de ambiente (ver `.env.example`):

| Variável | Pra que serve |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | acesso ao Supabase compartilhado |
| `AUTH_JWT_SECRET` | assina o cookie de sessão (gerar um novo por ambiente, nunca reusar dev↔prod) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | usados só pelo `npm run seed:admin` |
| `APP_URL` | usado pra montar a URL pública de arquivos enviados (upload) |
| `N8N_PROCESSADOR_WEBHOOK_URL` | webhook do workflow "Processador de Conhecimento" |
| `N8N_API_URL` / `N8N_API_KEY` | API do n8n (usada pelos scripts em `scripts/`, não pela app em si) |

## Scripts de manutenção (`scripts/*.mjs`)

Esses scripts falam direto com a API do n8n (não fazem parte da aplicação rodando, são
ferramentas pontuais que foram usadas pra montar/corrigir a infraestrutura):

- `seed-admin.mjs` — cria/atualiza o usuário admin no Supabase
- `criar-workflow-processador.mjs` — recria o workflow "Processador de Conhecimento" do zero
  (referência caso precise recriar ou clonar pra um ambiente novo)
- `criar-workflow-executar-gatilho.mjs` — idem, pro workflow "Executar Gatilho"
- `anexar-gatilho-aos-agentes.mjs` — anexa a tool "Executar Gatilho" a um agente (edita
  `agenteId` fixo dentro do script antes de rodar pra um agente novo)
- `fix-rag-multiagente.mjs` — corrige `tableName` + filtro de metadata dos nós
  `Supabase Vector Store` de uma lista de workflows (usado pra corrigir IPAM/AMAGIS/ASMEGO)

Rodar assim: `N8N_API_KEY=<chave> node scripts/<nome>.mjs` (a chave é gerada em
Settings → n8n API dentro do editor do n8n).

## Deploy (produção)

- **Onde**: VPS `31.97.85.196` (mesma do n8n/Chatwoot), via EasyPanel, serviço
  `criadordigital/painel-agentes`
- **Domínio**: `agentes.crdseguros.com.br` (porta interna **80**, não 3000 — o EasyPanel
  força a app a escutar em 80 mesmo com `PORT=3000` no `.env`; o domínio tem que apontar pra
  porta 80 no mapeamento do EasyPanel)
- **Fonte**: repositório GitHub `viniciosmkt001-art/painel-agentes-crd` (público — sem
  segredos no código, só `.env` de exemplo)
- **Redeploy**: `git push` pro `master` + clicar em "Implantar" no EasyPanel (não faz deploy
  automático em cada push, é manual)
- **Uploads**: pasta `public/uploads` — configurar volume persistente no EasyPanel se ainda
  não estiver montado, senão os arquivos somem a cada novo deploy

### Se o build falhar de novo

Já apareceram esses 3 problemas ao configurar o deploy (todos já corrigidos, mas documentando
pra não repetir o diagnóstico):
1. `npm ci` falhando por incompatibilidade de engine — o `@supabase/supabase-js` exige
   Node ≥ 22 (Dockerfile já usa `node:22-alpine`)
2. `package-lock.json` gerado no Windows sem entradas de dependência opcional do Linux —
   regenerar rodando `npm install` dentro de um container Linux se voltar a acontecer
3. `next build` falha coletando dados de rota por falta de env vars — o Dockerfile já injeta
   valores placeholder só pro build (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `AUTH_JWT_SECRET`); os valores reais em runtime vêm do ambiente configurado no EasyPanel

## Como fazer melhorias

### Adicionar um agente novo (associação sem infraestrutura ainda)

**Não está automatizado ainda.** O caminho hoje é manual:
1. Clonar o workflow "Luis Beta - IPAM" no editor do n8n (é o mais completo e testado)
2. Trocar credenciais (WhatsApp/Evolution, dentro do próprio n8n)
3. Criar a linha em `agentes` (pelo próprio painel, botão "Criar agente")
4. Ajustar o node `Supabase Vector Store` do clone pra apontar pra tabela `documents` com
   filtro de metadata `agente_id` = uuid do novo agente (usar `fix-rag-multiagente.mjs` como
   referência)
5. Anexar a tool "Executar Gatilho" com o `agenteId` certo (usar
   `anexar-gatilho-aos-agentes.mjs` como referência)
6. Limpar o prompt do clone (não é só trocar o nome da associação — o conteúdo de produto,
   horários, tom, etc. precisa ser reescrito pra associação nova)

Automatizar esse fluxo (clonagem via API do painel) ficou fora do escopo desta primeira
versão — é a melhoria mais valiosa a fazer a seguir se o número de associações crescer.

### Suportar YouTube e Áudio na base de conhecimento

Hoje o "Processador de Conhecimento" marca esses dois tipos como "não suportado". Pra
suportar:
- **Áudio**: precisa de um passo de transcrição (Whisper via OpenAI, já usado em outras
  partes do n8n) antes de gerar o embedding
- **YouTube**: precisa buscar a transcrição/legenda do vídeo (API do YouTube ou biblioteca de
  transcript) antes de gerar o embedding

### Migrar os agentes existentes pra credenciais dinâmicas (`integracoes`)

Hoje só agentes novos (se/quando o fluxo de clonagem for construído) usariam a tabela
`integracoes` de verdade. Migrar IPAM/AMAGIS/ASMEGO pra ler credenciais dali em vez de
credenciais estáticas do n8n é possível, mas devagar e um agente por vez — tocar nos 3 ao
mesmo tempo é risco desnecessário.

### Adicionar "trocar minha própria senha"

Hoje só existe criar/remover outros usuários (admin). Não existe uma tela de perfil pro
próprio usuário trocar a senha — é uma lacuna pequena e razoavelmente simples de fechar
(`PATCH /api/usuarios/me` + tela em `/admin/perfil`).

## Limitações conhecidas (resumo)

- YouTube e Áudio: upload funciona, processamento não (ver acima)
- Criar agente novo do zero: só documentado, não automatizado
- Integrações editáveis: existem no painel, mas os 3 agentes reais ainda não leem de lá
- Sem tela de troca de senha própria
- Deploy não é automático em cada push (precisa clicar "Implantar" manualmente)

## Contexto de bugs corrigidos (histórico, não afeta uso diário)

Durante a construção deste painel, foram encontrados e corrigidos bugs reais que já estavam
em produção antes de qualquer código do painel existir:
- RAG do IPAM, AMAGIS e ASMEGO todos apontavam pra tabela errada (nunca funcionou de verdade
  antes desta correção)
- AMAGIS também tinha reconhecimento de usuário e busca de cotação quebrados pela mesma causa
- Prompt do IPAM dizia "em parceria com a ASMEGO" (erro de clonagem de workflow)
- Condição de corrida no cadastro de contato novo do IPAM (mensagem seria perdida)
- Modelo caro (`o3-mini`) no agente de follow-up trocado por um mais barato

Nenhum desses bugs tem relação com o código deste painel — foram achados investigando a
infraestrutura do n8n antes de conectar o painel a ela.
