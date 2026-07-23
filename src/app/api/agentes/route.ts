import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { data, error } = await supabaseAdmin
    .from("agentes")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const createSchema = z.object({
  nome: z.string().min(1),
  associacao: z.string().min(1),
  tom_personalidade: z.string().default("profissional"),
  tamanho_resposta: z.enum(["curto", "medio", "longo"]).default("medio"),
  prompt_base: z.string().default(""),
});

export async function POST(request: NextRequest) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("agentes")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
