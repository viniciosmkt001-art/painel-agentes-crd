import { randomUUID } from "node:crypto";

const N8N_BASE = "https://criadordigital-n8n-editor.cx2yih.easypanel.host";
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error("Defina N8N_API_KEY no ambiente antes de rodar este script.");
  process.exit(1);
}

const SUPABASE_CRED = { id: "VMbxpkPwUzPdPSzr", name: "Supabase account 3" };
const OPENAI_CRED = { id: "gS0VIBWwG18P09J7", name: "OpenAi account" };

const id = () => randomUUID();

const nodes = [
  {
    id: id(),
    name: "Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: [-1200, 0],
    parameters: {
      httpMethod: "POST",
      path: "processador-conhecimento",
      responseMode: "onReceived",
      options: {},
    },
  },
  {
    id: id(),
    name: "Switch por Tipo",
    type: "n8n-nodes-base.switch",
    typeVersion: 3.2,
    position: [-960, 0],
    parameters: {
      rules: {
        values: [
          {
            outputKey: "faq",
            renameOutput: true,
            conditions: {
              options: { version: 2, leftValue: "", caseSensitive: true, typeValidation: "strict" },
              combinator: "and",
              conditions: [
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "faq",
                },
              ],
            },
          },
          {
            outputKey: "conteudo_web",
            renameOutput: true,
            conditions: {
              options: { version: 2, leftValue: "", caseSensitive: true, typeValidation: "strict" },
              combinator: "or",
              conditions: [
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "site",
                },
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "pagina_unica",
                },
              ],
            },
          },
          {
            outputKey: "documento",
            renameOutput: true,
            conditions: {
              options: { version: 2, leftValue: "", caseSensitive: true, typeValidation: "strict" },
              combinator: "and",
              conditions: [
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "documento",
                },
              ],
            },
          },
          {
            outputKey: "nao_suportado",
            renameOutput: true,
            conditions: {
              options: { version: 2, leftValue: "", caseSensitive: true, typeValidation: "strict" },
              combinator: "or",
              conditions: [
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "youtube",
                },
                {
                  id: id(),
                  operator: { type: "string", operation: "equals" },
                  leftValue: "={{ $json.body.tipo }}",
                  rightValue: "audio",
                },
              ],
            },
          },
        ],
      },
      options: {},
    },
  },
  {
    id: id(),
    name: "Texto FAQ",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [-700, -240],
    parameters: {
      options: {},
      assignments: {
        assignments: [
          { id: id(), name: "text", type: "string", value: "={{ $json.body.conteudo }}" },
          { id: id(), name: "fonteId", type: "string", value: "={{ $json.body.fonteId }}" },
          { id: id(), name: "agenteId", type: "string", value: "={{ $json.body.agenteId }}" },
          { id: id(), name: "titulo", type: "string", value: "={{ $json.body.titulo }}" },
        ],
      },
    },
  },
  {
    id: id(),
    name: "Buscar Site",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [-700, -80],
    parameters: {
      url: "={{ $json.body.url }}",
      method: "GET",
      options: { response: { response: { responseFormat: "text" } } },
    },
  },
  {
    id: id(),
    name: "Extrair Texto HTML",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-500, -80],
    parameters: {
      jsCode:
        "const html = $json.data || '';\n" +
        "const text = html\n" +
        "  .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')\n" +
        "  .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')\n" +
        "  .replace(/<[^>]+>/g, ' ')\n" +
        "  .replace(/\\s+/g, ' ')\n" +
        "  .trim();\n" +
        "const origem = $('Switch por Tipo').item.json.body;\n" +
        "return [{ json: { text, fonteId: origem.fonteId, agenteId: origem.agenteId, titulo: origem.titulo } }];",
    },
  },
  {
    id: id(),
    name: "Baixar Documento",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [-700, 80],
    parameters: {
      url: "={{ $json.body.url }}",
      method: "GET",
      options: { response: { response: { responseFormat: "file" } } },
    },
  },
  {
    id: id(),
    name: "Extrair PDF",
    type: "n8n-nodes-base.extractFromFile",
    typeVersion: 1,
    position: [-500, 80],
    parameters: { options: {}, operation: "pdf" },
  },
  {
    id: id(),
    name: "Texto Documento",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [-300, 80],
    parameters: {
      options: {},
      assignments: {
        assignments: [
          { id: id(), name: "text", type: "string", value: "={{ $json.text }}" },
          {
            id: id(),
            name: "fonteId",
            type: "string",
            value: "={{ $('Switch por Tipo').item.json.body.fonteId }}",
          },
          {
            id: id(),
            name: "agenteId",
            type: "string",
            value: "={{ $('Switch por Tipo').item.json.body.agenteId }}",
          },
          {
            id: id(),
            name: "titulo",
            type: "string",
            value: "={{ $('Switch por Tipo').item.json.body.titulo }}",
          },
        ],
      },
    },
  },
  {
    id: id(),
    name: "Marcar Nao Suportado",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [-700, 240],
    parameters: {
      options: {},
      assignments: {
        assignments: [
          { id: id(), name: "fonteId", type: "string", value: "={{ $json.body.fonteId }}" },
          { id: id(), name: "status", type: "string", value: "erro" },
          {
            id: id(),
            name: "erro_detalhe",
            type: "string",
            value: "Tipo ainda não suportado nesta fase do painel (youtube/áudio)",
          },
        ],
      },
    },
  },
  {
    id: id(),
    name: "Character Text Splitter",
    type: "@n8n/n8n-nodes-langchain.textSplitterCharacterTextSplitter",
    typeVersion: 1,
    position: [-140, -240],
    parameters: { chunkOverlap: 200 },
  },
  {
    id: id(),
    name: "Default Data Loader",
    type: "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
    typeVersion: 1,
    position: [0, -160],
    parameters: {
      jsonData: "={{ $json.text }}",
      jsonMode: "expressionData",
      options: {
        metadata: {
          metadataValues: [
            { name: "agente_id", value: "={{ $json.agenteId }}" },
            { name: "fonte_id", value: "={{ $json.fonteId }}" },
          ],
        },
      },
    },
  },
  {
    id: id(),
    name: "Embeddings OpenAI",
    type: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
    typeVersion: 1.2,
    position: [0, -320],
    parameters: { model: "text-embedding-3-small", options: {} },
    credentials: { openAiApi: OPENAI_CRED },
  },
  {
    id: id(),
    name: "Insert into Supabase Vectorstore",
    type: "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
    typeVersion: 1,
    position: [200, -80],
    parameters: {
      mode: "insert",
      options: { queryName: "match_documents" },
      tableName: { __rl: true, mode: "list", value: "documents", cachedResultName: "documents" },
    },
    credentials: { supabaseApi: SUPABASE_CRED },
  },
  {
    id: id(),
    name: "Atualizar Status Pronto",
    type: "n8n-nodes-base.supabase",
    typeVersion: 1,
    onError: "continueRegularOutput",
    position: [420, -80],
    parameters: {
      operation: "update",
      tableId: "fontes_conhecimento",
      filters: { conditions: [{ keyName: "id", keyValue: "={{ $json.fonteId }}", condition: "eq" }] },
      fieldsUi: { fieldValues: [{ fieldId: "status", fieldValue: "pronto" }] },
    },
    credentials: { supabaseApi: SUPABASE_CRED },
  },
  {
    id: id(),
    name: "Atualizar Status Erro",
    type: "n8n-nodes-base.supabase",
    typeVersion: 1,
    onError: "continueRegularOutput",
    position: [-500, 240],
    parameters: {
      operation: "update",
      tableId: "fontes_conhecimento",
      filters: { conditions: [{ keyName: "id", keyValue: "={{ $json.fonteId }}", condition: "eq" }] },
      fieldsUi: {
        fieldValues: [
          { fieldId: "status", fieldValue: "={{ $json.status }}" },
          { fieldId: "erro_detalhe", fieldValue: "={{ $json.erro_detalhe }}" },
        ],
      },
    },
    credentials: { supabaseApi: SUPABASE_CRED },
  },
];

const connections = {
  Webhook: { main: [[{ node: "Switch por Tipo", type: "main", index: 0 }]] },
  "Switch por Tipo": {
    main: [
      [{ node: "Texto FAQ", type: "main", index: 0 }],
      [{ node: "Buscar Site", type: "main", index: 0 }],
      [{ node: "Baixar Documento", type: "main", index: 0 }],
      [{ node: "Marcar Nao Suportado", type: "main", index: 0 }],
    ],
  },
  "Texto FAQ": { main: [[{ node: "Insert into Supabase Vectorstore", type: "main", index: 0 }]] },
  "Buscar Site": { main: [[{ node: "Extrair Texto HTML", type: "main", index: 0 }]] },
  "Extrair Texto HTML": { main: [[{ node: "Insert into Supabase Vectorstore", type: "main", index: 0 }]] },
  "Baixar Documento": { main: [[{ node: "Extrair PDF", type: "main", index: 0 }]] },
  "Extrair PDF": { main: [[{ node: "Texto Documento", type: "main", index: 0 }]] },
  "Texto Documento": { main: [[{ node: "Insert into Supabase Vectorstore", type: "main", index: 0 }]] },
  "Marcar Nao Suportado": { main: [[{ node: "Atualizar Status Erro", type: "main", index: 0 }]] },
  "Character Text Splitter": {
    ai_textSplitter: [[{ node: "Default Data Loader", type: "ai_textSplitter", index: 0 }]],
  },
  "Default Data Loader": {
    ai_document: [[{ node: "Insert into Supabase Vectorstore", type: "ai_document", index: 0 }]],
  },
  "Embeddings OpenAI": {
    ai_embedding: [[{ node: "Insert into Supabase Vectorstore", type: "ai_embedding", index: 0 }]],
  },
  "Insert into Supabase Vectorstore": {
    main: [[{ node: "Atualizar Status Pronto", type: "main", index: 0 }]],
  },
};

const workflow = {
  name: "Processador de Conhecimento",
  nodes,
  connections,
  settings: { executionOrder: "v1" },
};

const res = await fetch(`${N8N_BASE}/api/v1/workflows`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": N8N_API_KEY,
  },
  body: JSON.stringify(workflow),
});

const body = await res.json();

if (!res.ok) {
  console.error("Falha ao criar workflow:", res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("Workflow criado com sucesso. id:", body.id);
console.log("Ativar manualmente no editor antes de usar (fica desativado por padrão).");
