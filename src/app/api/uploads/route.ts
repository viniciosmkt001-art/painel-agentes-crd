import { NextRequest, NextResponse } from "next/server";
import { guard, isResponse } from "@/lib/api-guard";
import { validateUpload, saveFile, type UploadKind } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await guard("editor");
  if (isResponse(session)) return session;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const kind = formData?.get("kind");

  if (!(file instanceof File) || (kind !== "documento" && kind !== "audio")) {
    return NextResponse.json({ error: "Envie um arquivo e o campo kind (documento|audio)" }, { status: 400 });
  }

  const error = validateUpload(file, kind as UploadKind);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const relativeUrl = await saveFile(file, kind as UploadKind);
  const baseUrl = process.env.APP_URL ?? new URL(request.url).origin;

  return NextResponse.json({ url: `${baseUrl}${relativeUrl}` }, { status: 201 });
}
