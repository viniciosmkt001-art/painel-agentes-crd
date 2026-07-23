import { NextResponse } from "next/server";
import { requireRole, type Role, type SessionPayload } from "./auth";

export async function guard(role: Role): Promise<SessionPayload | NextResponse> {
  try {
    return await requireRole(role);
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Sem permissão" }, { status });
  }
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
