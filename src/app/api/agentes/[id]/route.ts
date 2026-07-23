import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("agentes").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  associacao: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
  tom_personalidade: z.string().optional(),
  tamanho_resposta: z.enum(["curto", "medio", "longo"]).optional(),
  prompt_base: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("agentes")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
