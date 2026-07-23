import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { NovoAgenteForm } from "./novo-agente-form";

export default async function AgentesPage() {
  const { data: agentes } = await supabaseAdmin
    .from("agentes")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Agentes</h1>

      <div className="mb-8 space-y-2">
        {(agentes ?? []).map((agente) => (
          <Link
            key={agente.id}
            href={`/admin/agentes/${agente.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-600"
          >
            <div>
              <p className="font-medium">{agente.nome}</p>
              <p className="text-sm text-neutral-400">{agente.associacao}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                agente.ativo ? "bg-emerald-900 text-emerald-300" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {agente.ativo ? "ativo" : "inativo"}
            </span>
          </Link>
        ))}

        {(agentes ?? []).length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum agente cadastrado ainda.</p>
        )}
      </div>

      <NovoAgenteForm />
    </div>
  );
}
