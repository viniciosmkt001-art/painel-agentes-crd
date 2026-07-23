import { randomUUID } from "node:crypto";

const N8N_BASE = "https://criadordigital-n8n-editor.cx2yih.easypanel.host";
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error("Defina N8N_API_KEY no ambiente.");
  process.exit(1);
}

const SUPABASE_CRED = { id: "VMbxpkPwUzPdPSzr", name: "Supabase account 3" };
const id = () => randomUUID();

const nodes = [
  {
    id: id(),
    name: "When Executed by Another Workflow",
    type: "n8n-nodes-base.executeWorkflowTrigger",
    typeVersion: 1.1,
    position: [-600, 0],
    parameters: {
      workflowInputs: {
        values: [{ name: "agenteId" }, { name: "intencao" }],
      },
    },
  },
  {
    id: id(),
    name: "Buscar Gatilho",
    type: "n8n-nodes-base.supabase",
    typeVersion: 1,
    position: [-400, 0],
    alwaysOutputData: true,
    parameters: {
      operation: "getAll",
      tableId: "gatilhos",
      returnAll: true,
      filters: {
        conditions: [
          { keyName: "agente_id", keyValue: "={{ $json.agenteId }}" },
          { keyName: "intencao", keyValue: "={{ $json.intencao }}" },
        ],
      },
    },
    credentials: { supabaseApi: SUPABASE_CRED },
  },
  {
    id: id(),
    name: "Selecionar Gatilho Ativo",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-200, 0],
    parameters: {
      jsCode:
        "const encontrado = $input.all().find((item) => item.json.ativo === true);\n" +
        "if (!encontrado) {\n" +
        "  return [{ json: { found: false, mensagem: 'Nenhum gatilho ativo configurado para essa intenção.' } }];\n" +
        "}\n" +
        "return [{ json: { found: true, acao_tipo: encontrado.json.acao_tipo, acao_config: encontrado.json.acao_config } }];",
    },
  },
];

const connections = {
  "When Executed by Another Workflow": { main: [[{ node: "Buscar Gatilho", type: "main", index: 0 }]] },
  "Buscar Gatilho": { main: [[{ node: "Selecionar Gatilho Ativo", type: "main", index: 0 }]] },
};

const workflow = {
  name: "Executar Gatilho",
  nodes,
  connections,
  settings: { executionOrder: "v1" },
};

const res = await fetch(`${N8N_BASE}/api/v1/workflows`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-N8N-API-KEY": N8N_API_KEY },
  body: JSON.stringify(workflow),
});

const body = await res.json();

if (!res.ok) {
  console.error("Falha ao criar workflow:", res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("Workflow 'Executar Gatilho' criado. id:", body.id);

const activateRes = await fetch(`${N8N_BASE}/api/v1/workflows/${body.id}/activate`, {
  method: "POST",
  headers: { "X-N8N-API-KEY": N8N_API_KEY },
});

if (!activateRes.ok) {
  console.error("Falha ao ativar:", await activateRes.text());
} else {
  console.log("Ativado.");
}
