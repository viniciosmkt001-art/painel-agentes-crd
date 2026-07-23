import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { AgenteDetail } from "./agente-detail";

export default async function AgenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [{ data: agente }, { data: fontes }, { data: gatilhos }, { data: integracoes }] = await Promise.all([
    supabaseAdmin.from("agentes").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("fontes_conhecimento")
      .select("*")
      .eq("agente_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("gatilhos").select("*").eq("agente_id", id).order("created_at", { ascending: false }),
    supabaseAdmin.from("integracoes").select("*").eq("agente_id", id),
  ]);

  if (!agente) notFound();

  return (
    <AgenteDetail
      agente={agente}
      fontesIniciais={fontes ?? []}
      gatilhosIniciais={gatilhos ?? []}
      integracoesIniciais={integracoes ?? []}
      role={session?.role ?? "editor"}
    />
  );
}
