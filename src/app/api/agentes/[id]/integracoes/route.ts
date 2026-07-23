import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("admin");
  if (isResponse(session)) return session;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("integracoes")
    .select("*")
    .eq("agente_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const upsertSchema = z.object({
  tipo: z.enum(["chatwoot", "rd_station", "whatsapp"]),
  config: z.record(z.string(), z.string()),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("admin");
  if (isResponse(session)) return session;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("integracoes")
    .upsert(
      { agente_id: id, tipo: parsed.data.tipo, config: parsed.data.config, updated_at: new Date().toISOString() },
      { onConflict: "agente_id,tipo" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
