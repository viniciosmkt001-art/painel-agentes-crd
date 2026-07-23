import { NextRequest, NextResponse } from "next/server";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fonteId: string }> },
) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id, fonteId } = await params;
  const { error } = await supabaseAdmin
    .from("fontes_conhecimento")
    .delete()
    .eq("id", fonteId)
    .eq("agente_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
