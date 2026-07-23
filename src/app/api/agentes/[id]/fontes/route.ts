import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("fontes_conhecimento")
    .select("*")
    .eq("agente_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const createSchema = z.object({
  tipo: z.enum(["faq", "site", "pagina_unica", "documento", "youtube", "audio"]),
  titulo: z.string().min(1),
  conteudo: z.string().optional(),
  url: z.string().url().optional(),
  arquivo_path: z.string().optional(),
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
    .from("fontes_conhecimento")
    .insert({ ...parsed.data, agente_id: id, status: "pendente" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Dispara o processador no n8n (fire-and-forget). O n8n atualiza o status direto no Supabase.
  const webhookUrl = process.env.N8N_PROCESSADOR_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fonteId: data.id, tipo: data.tipo, agenteId: id }),
    }).catch((err) => {
      console.error("Falha ao acionar processador de conhecimento no n8n:", err);
    });
  }

  return NextResponse.json(data, { status: 201 });
}
