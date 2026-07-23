import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";

const COOKIE_NAME = "painel_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12h

function getSecretKey() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET não definido");
  return new TextEncoder().encode(secret);
}

export type Role = "admin" | "editor";

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
};

export async function verifyCredentials(email: string, password: string) {
  const { data, error } = await supabaseAdmin
    .from("panel_users")
    .select("id, email, password_hash, role")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) return null;

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return null;

  return { userId: data.id as string, email: data.email as string, role: data.role as Role };
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("Não autenticado"), { status: 401 });
  }
  return session;
}

export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== role) {
    throw Object.assign(new Error("Sem permissão"), { status: 403 });
  }
  return session;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
