import { NextRequest, NextResponse } from "next/server";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; gatilhoId: string }> },
) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id, gatilhoId } = await params;
  const { error } = await supabaseAdmin
    .from("gatilhos")
    .delete()
    .eq("id", gatilhoId)
    .eq("agente_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
