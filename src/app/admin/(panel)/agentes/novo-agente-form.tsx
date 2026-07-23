"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NovoAgenteForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [associacao, setAssociacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/agentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, associacao }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Não foi possível criar o agente");
      return;
    }

    setNome("");
    setAssociacao("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 rounded-lg border border-dashed border-neutral-700 p-4"
    >
      <div className="flex-1">
        <label className="mb-1 block text-sm text-neutral-400">Nome do agente</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          placeholder="Ex: Luis Beta - AMAGIS"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-sm text-neutral-400">Associação</label>
        <input
          required
          value={associacao}
          onChange={(e) => setAssociacao(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          placeholder="Ex: AMAGIS"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {loading ? "Criando..." : "Criar agente"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
