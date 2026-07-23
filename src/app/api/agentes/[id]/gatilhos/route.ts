import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("gatilhos")
    .select("*")
    .eq("agente_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const createSchema = z.object({
  intencao: z.string().min(1),
  acao_tipo: z.string().min(1),
  acao_config: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("gatilhos")
    .insert({ ...parsed.data, agente_id: id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
