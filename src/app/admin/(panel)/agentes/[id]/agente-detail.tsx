"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agente, FonteConhecimento, Gatilho, FonteTipo, Integracao, IntegracaoTipo } from "@/lib/types";
import type { Role } from "@/lib/auth";

const TABS = ["personalidade", "conhecimento", "gatilhos", "integracoes"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  personalidade: "Personalidade",
  conhecimento: "Base de Conhecimento",
  gatilhos: "Gatilhos",
  integracoes: "Integrações",
};

const FONTE_TIPOS: { value: FonteTipo; label: string }[] = [
  { value: "faq", label: "Perguntas e Respostas" },
  { value: "documento", label: "Documentos" },
  { value: "site", label: "Sites" },
  { value: "pagina_unica", label: "Páginas Únicas" },
  { value: "youtube", label: "YouTube" },
  { value: "audio", label: "Áudio" },
];

export function AgenteDetail({
  agente,
  fontesIniciais,
  gatilhosIniciais,
  integracoesIniciais,
  role,
}: {
  agente: Agente;
  fontesIniciais: FonteConhecimento[];
  gatilhosIniciais: Gatilho[];
  integracoesIniciais: Integracao[];
  role: Role;
}) {
  const [tab, setTab] = useState<Tab>("personalidade");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-semibold">{agente.nome}</h1>
      <p className="mb-6 text-sm text-neutral-400">{agente.associacao}</p>

      <div className="mb-6 flex gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${
              tab === t
                ? "border-b-2 border-neutral-100 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "personalidade" && <PersonalidadeTab agente={agente} />}
      {tab === "conhecimento" && <ConhecimentoTab agenteId={agente.id} fontesIniciais={fontesIniciais} />}
      {tab === "gatilhos" && <GatilhosTab agenteId={agente.id} gatilhosIniciais={gatilhosIniciais} />}
      {tab === "integracoes" && (
        <IntegracoesTab agenteId={agente.id} integracoesIniciais={integracoesIniciais} isAdmin={role === "admin"} />
      )}
    </div>
  );
}

function PersonalidadeTab({ agente }: { agente: Agente }) {
  const router = useRouter();
  const [tom, setTom] = useState(agente.tom_personalidade);
  const [tamanho, setTamanho] = useState(agente.tamanho_resposta);
  const [prompt, setPrompt] = useState(agente.prompt_base);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/agentes/${agente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tom_personalidade: tom, tamanho_resposta: tamanho, prompt_base: prompt }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-400">Tom de personalidade</label>
        <input
          value={tom}
          onChange={(e) => setTom(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          placeholder="Ex: profissional, descontraído, formal"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-400">Tamanho de resposta</label>
        <select
          value={tamanho}
          onChange={(e) => setTamanho(e.target.value as typeof tamanho)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
        >
          <option value="curto">Curto</option>
          <option value="medio">Médio</option>
          <option value="longo">Longo</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-400">Prompt base</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          placeholder="Instruções gerais que definem como o agente deve se comportar..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function ConhecimentoTab({
  agenteId,
  fontesIniciais,
}: {
  agenteId: string;
  fontesIniciais: FonteConhecimento[];
}) {
  const router = useRouter();
  const [tipoAtivo, setTipoAtivo] = useState<FonteTipo>("faq");
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fontesDoTipo = fontesIniciais.filter((f) => f.tipo === tipoAtivo);
  const usaUrl = tipoAtivo === "site" || tipoAtivo === "pagina_unica" || tipoAtivo === "youtube";
  const usaArquivo = tipoAtivo === "documento" || tipoAtivo === "audio";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSaving(true);

    const payload: Record<string, string> = { tipo: tipoAtivo, titulo };

    if (usaArquivo) {
      if (!arquivo) {
        setErro("Selecione um arquivo");
        setSaving(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", arquivo);
      formData.append("kind", tipoAtivo);
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        setErro(data.error ?? "Falha no upload do arquivo");
        setSaving(false);
        return;
      }
      const { url } = await uploadRes.json();
      payload.url = url;
    } else if (usaUrl) {
      payload.url = valor;
    } else {
      payload.conteudo = valor;
    }

    const res = await fetch(`/api/agentes/${agenteId}/fontes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      setErro("Não foi possível adicionar a fonte");
      return;
    }

    setTitulo("");
    setValor("");
    setArquivo(null);
    router.refresh();
  }

  async function handleDelete(fonteId: string) {
    await fetch(`/api/agentes/${agenteId}/fontes/${fonteId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {FONTE_TIPOS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTipoAtivo(t.value)}
            className={`rounded-full px-3 py-1 text-xs ${
              tipoAtivo === t.value
                ? "bg-neutral-100 text-neutral-900"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mb-6 space-y-3 rounded-lg border border-dashed border-neutral-700 p-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Título</label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            {usaArquivo ? "Arquivo" : usaUrl ? "URL" : tipoAtivo === "faq" ? "Pergunta e resposta" : "Conteúdo"}
          </label>
          {tipoAtivo === "faq" ? (
            <textarea
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
              placeholder="Pergunta: ...&#10;Resposta: ..."
            />
          ) : usaArquivo ? (
            <input
              key={tipoAtivo}
              required
              type="file"
              accept={tipoAtivo === "documento" ? ".pdf,.xlsx,.xls,.docx,.txt" : ".mp3,.m4a,.ogg,.wav,.webm"}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1 file:text-neutral-100"
            />
          ) : (
            <input
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          )}
        </div>
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {saving ? "Adicionando..." : "Adicionar fonte"}
        </button>
      </form>

      <div className="space-y-2">
        {fontesDoTipo.map((fonte) => (
          <div
            key={fonte.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{fonte.titulo}</p>
              <p className="text-xs text-neutral-500">{fonte.url ?? fonte.conteudo}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={fonte.status} />
              <button
                onClick={() => handleDelete(fonte.id)}
                className="text-xs text-neutral-500 hover:text-red-400"
              >
                remover
              </button>
            </div>
          </div>
        ))}

        {fontesDoTipo.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma fonte deste tipo ainda.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: FonteConhecimento["status"] }) {
  const styles: Record<FonteConhecimento["status"], string> = {
    pendente: "bg-neutral-800 text-neutral-400",
    processando: "bg-amber-900 text-amber-300",
    pronto: "bg-emerald-900 text-emerald-300",
    erro: "bg-red-900 text-red-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>{status}</span>;
}

function GatilhosTab({ agenteId, gatilhosIniciais }: { agenteId: string; gatilhosIniciais: Gatilho[] }) {
  const router = useRouter();
  const [intencao, setIntencao] = useState("");
  const [acaoTipo, setAcaoTipo] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/agentes/${agenteId}/gatilhos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intencao, acao_tipo: acaoTipo, acao_config: {} }),
    });
    setSaving(false);
    setIntencao("");
    setAcaoTipo("");
    router.refresh();
  }

  async function handleDelete(gatilhoId: string) {
    await fetch(`/api/agentes/${agenteId}/gatilhos/${gatilhoId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex items-end gap-3 rounded-lg border border-dashed border-neutral-700 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-neutral-400">Intenção</label>
          <input
            required
            value={intencao}
            onChange={(e) => setIntencao(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
            placeholder="Ex: candidato_vaga"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-neutral-400">Ação</label>
          <input
            required
            value={acaoTipo}
            onChange={(e) => setAcaoTipo(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
            placeholder="Ex: enviar_link_e_desqualificar"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {saving ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      <div className="space-y-2">
        {gatilhosIniciais.map((gatilho) => (
          <div
            key={gatilho.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <p className="text-sm">
              <span className="font-medium">{gatilho.intencao}</span>
              <span className="text-neutral-500"> → {gatilho.acao_tipo}</span>
            </p>
            <button
              onClick={() => handleDelete(gatilho.id)}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              remover
            </button>
          </div>
        ))}

        {gatilhosIniciais.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum gatilho configurado ainda.</p>
        )}
      </div>
    </div>
  );
}

const INTEGRACAO_CAMPOS: Record<IntegracaoTipo, { label: string; campos: { key: string; label: string }[] }> = {
  chatwoot: {
    label: "Chatwoot",
    campos: [
      { key: "base_url", label: "URL base (ex: https://chat.crdseguros.com.br)" },
      { key: "account_id", label: "Account ID" },
      { key: "inbox_id", label: "Inbox ID" },
      { key: "api_token", label: "API Token" },
    ],
  },
  rd_station: {
    label: "RD Station CRM",
    campos: [{ key: "token", label: "Token de instância" }],
  },
  whatsapp: {
    label: "WhatsApp (Evolution/Cloud API)",
    campos: [
      { key: "phone_number_id", label: "Phone Number ID" },
      { key: "waba_id", label: "WABA ID" },
      { key: "token", label: "Token" },
    ],
  },
};

function IntegracoesTab({
  agenteId,
  integracoesIniciais,
  isAdmin,
}: {
  agenteId: string;
  integracoesIniciais: Integracao[];
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return (
      <p className="text-sm text-neutral-500">
        Só administradores podem ver e editar credenciais de integração.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {(Object.keys(INTEGRACAO_CAMPOS) as IntegracaoTipo[]).map((tipo) => (
        <IntegracaoCard
          key={tipo}
          agenteId={agenteId}
          tipo={tipo}
          integracaoAtual={integracoesIniciais.find((i) => i.tipo === tipo)}
        />
      ))}
    </div>
  );
}

function IntegracaoCard({
  agenteId,
  tipo,
  integracaoAtual,
}: {
  agenteId: string;
  tipo: IntegracaoTipo;
  integracaoAtual: Integracao | undefined;
}) {
  const router = useRouter();
  const { label, campos } = INTEGRACAO_CAMPOS[tipo];
  const [valores, setValores] = useState<Record<string, string>>(integracaoAtual?.config ?? {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/agentes/${agenteId}/integracoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, config: valores }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {integracaoAtual && (
          <span className="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300">configurado</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.key}>
            <label className="mb-1 block text-xs text-neutral-400">{campo.label}</label>
            <input
              type="password"
              value={valores[campo.key] ?? ""}
              onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
