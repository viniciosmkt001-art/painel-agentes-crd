"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PanelUser } from "@/lib/types";

export function UsuariosClient({
  usuariosIniciais,
  usuarioAtualId,
}: {
  usuariosIniciais: PanelUser[];
  usuarioAtualId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Não foi possível criar o usuário (senha precisa ter 8+ caracteres)");
      return;
    }

    setEmail("");
    setPassword("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 space-y-3 rounded-lg border border-dashed border-neutral-700 p-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Senha provisória</label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Papel</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {saving ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      <div className="space-y-2">
        {usuariosIniciais.map((usuario) => (
          <div
            key={usuario.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{usuario.email}</p>
              <p className="text-xs text-neutral-500">{usuario.role}</p>
            </div>
            {usuario.id !== usuarioAtualId && (
              <button
                onClick={() => handleDelete(usuario.id)}
                className="text-xs text-neutral-500 hover:text-red-400"
              >
                remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
