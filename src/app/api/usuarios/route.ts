import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { guard, isResponse } from "@/lib/api-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await guard("admin");
  if (isResponse(session)) return session;

  const { data, error } = await supabaseAdmin
    .from("panel_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "editor"]),
});

export async function POST(request: NextRequest) {
  const session = await guard("admin");
  if (isResponse(session)) return session;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const { data, error } = await supabaseAdmin
    .from("panel_users")
    .insert({ email: parsed.data.email, password_hash: passwordHash, role: parsed.data.role })
    .select("id, email, role, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
