const N8N_BASE = "https://criadordigital-n8n-editor.cx2yih.easypanel.host";
const N8N_API_KEY = process.env.N8N_API_KEY;

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

  let changed = 0;
  for (const node of wf.nodes) {
    if (node.type !== "@n8n/n8n-nodes-langchain.vectorStoreSupabase") continue;
    if (node.parameters?.mode !== "retrieve-as-tool") continue;

    const before = JSON.stringify(node.parameters.tableName);

    node.parameters.tableName = {
      __rl: true,
      mode: "list",
      value: "documents",
      cachedResultName: "documents",
    };

    node.parameters.options = {
      ...(node.parameters.options ?? {}),
      metadata: {
        metadataValues: [{ name: "agente_id", value: target.agenteId }],
      },
    };

    console.log(`  ${node.name}: tableName ${before} -> documents; filtro agente_id=${target.agenteId}`);
    changed++;
  }

  if (changed === 0) {
    console.log("  Nenhum node retrieve-as-tool encontrado, pulando.");
    continue;
  }

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
