import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Faltam env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD (veja .env.local)",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

const { data: existing } = await supabase
  .from("panel_users")
  .select("id")
  .eq("email", ADMIN_EMAIL)
  .maybeSingle();

if (existing) {
  console.log(`Usuário ${ADMIN_EMAIL} já existe, atualizando senha/papel para admin.`);
  const { error } = await supabase
    .from("panel_users")
    .update({ password_hash: passwordHash, role: "admin" })
    .eq("id", existing.id);
  if (error) {
    console.error("Erro ao atualizar usuário admin:", error.message);
    process.exit(1);
  }
} else {
  const { error } = await supabase
    .from("panel_users")
    .insert({ email: ADMIN_EMAIL, password_hash: passwordHash, role: "admin" });
  if (error) {
    console.error("Erro ao criar usuário admin:", error.message);
    process.exit(1);
  }
  console.log(`Usuário admin ${ADMIN_EMAIL} criado.`);
}
