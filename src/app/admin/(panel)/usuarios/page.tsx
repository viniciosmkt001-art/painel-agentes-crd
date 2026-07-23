import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { UsuariosClient } from "./usuarios-client";

export default async function UsuariosPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/admin/agentes");
  }

  const { data: usuarios } = await supabaseAdmin
    .from("panel_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Usuários</h1>
      <UsuariosClient usuariosIniciais={usuarios ?? []} usuarioAtualId={session.userId} />
    </div>
  );
}
