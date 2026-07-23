import { randomUUID } from "node:crypto";

const N8N_BASE = "https://criadordigital-n8n-editor.cx2yih.easypanel.host";
const N8N_API_KEY = process.env.N8N_API_KEY;
const GATILHO_WORKFLOW_ID = "vWUPc7eG4dV8TUsZ";

if (!N8N_API_KEY) {
  console.error("Defina N8N_API_KEY no ambiente.");
  process.exit(1);
}

const TARGETS = [
  { workflowId: "vJITD0wvP1R304kC", associacao: "IPAM", agenteId: "9a46e306-f536-4455-9751-0d2890d37965" },
  { workflowId: "pqJPbSdyeWWYVUyC", associacao: "AMAGIS", agenteId: "f7b4490f-17a8-46f2-87c4-412e7cd2061b" },
  { workflowId: "fhs0hBwKIpsySUJF", associacao: "ASMEGO", agenteId: "eead80ec-c830-4019-b9de-04c710ca5131" },
];

for (const target of TARGETS) {
  console.log(`\n=== ${target.associacao} (${target.workflowId}) ===`);

  const res = await fetch(`${N8N_BASE}/api/v1/workflows/${target.workflowId}`, {
    headers: { "X-N8N-API-KEY": N8N_API_KEY },
  });
  const wf = await res.json();

  if (wf.nodes.some((n) => n.name === "verificar_gatilho")) {
    console.log("  Já existe, pulando.");
    continue;
  }

  const recepcionista = wf.nodes.find((n) => n.name === "RECEPCIONISTA");
  if (!recepcionista) {
    console.log("  Node RECEPCIONISTA não encontrado, pulando.");
    continue;
  }

  const novoNode = {
    id: randomUUID(),
    name: "verificar_gatilho",
    type: "@n8n/n8n-nodes-langchain.toolWorkflow",
    typeVersion: 2.1,
    position: [recepcionista.position[0] - 200, recepcionista.position[1] + 320],
    parameters: {
      name: "verificar_gatilho",
      workflowId: { __rl: true, mode: "id", value: GATILHO_WORKFLOW_ID },
      description:
        "'verificar_gatilho': use SEMPRE que identificar uma intenção especial do cliente configurada pela equipe (ex: candidato a vaga, reclamação, pedido específico). Passe a intenção detectada em 'intencao' em snake_case (ex: candidato_vaga). Retorna a ação configurada (link, mensagem ou instrução de desqualificação) que você deve seguir ao responder.",
      workflowInputs: {
        value: {
          agenteId: target.agenteId,
          intencao: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('intencao', ``, 'string') }}",
        },
        schema: [
          {
            id: "agenteId",
            type: "string",
            display: true,
            required: false,
            displayName: "agenteId",
            defaultMatch: false,
            canBeUsedToMatch: true,
          },
          {
            id: "intencao",
            type: "string",
            display: true,
            required: false,
            displayName: "intencao",
            defaultMatch: false,
            canBeUsedToMatch: true,
          },
        ],
        mappingMode: "defineBelow",
        matchingColumns: [],
        attemptToConvertTypes: false,
        convertFieldsToString: false,
      },
    },
  };

  wf.nodes.push(novoNode);
  wf.connections["verificar_gatilho"] = {
    ai_tool: [[{ node: "RECEPCIONISTA", type: "ai_tool", index: 0 }]],
  };

  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings };

  const putRes = await fetch(`${N8N_BASE}/api/v1/workflows/${target.workflowId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-N8N-API-KEY": N8N_API_KEY },
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    console.error(`  FALHOU: ${putRes.status}`, await putRes.text());
    continue;
  }

  const updated = await putRes.json();
  console.log(`  OK. active=${updated.active}, nodes=${updated.nodes.length}`);
}
