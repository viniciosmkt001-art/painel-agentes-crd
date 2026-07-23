import { NextRequest, NextResponse } from "next/server";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("admin");
  if (isResponse(session)) return session;

  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json({ error: "Você não pode remover seu próprio usuário" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("panel_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
