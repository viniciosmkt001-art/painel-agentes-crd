import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads";

const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/webm": ".webm",
};

const MAX_DOCUMENT_MB = 20;
const MAX_AUDIO_MB = 25;

export type UploadKind = "documento" | "audio";

function typesFor(kind: UploadKind) {
  return kind === "documento" ? DOCUMENT_TYPES : AUDIO_TYPES;
}

function maxMbFor(kind: UploadKind) {
  return kind === "documento" ? MAX_DOCUMENT_MB : MAX_AUDIO_MB;
}

export function validateUpload(file: File, kind: UploadKind): string | null {
  const types = typesFor(kind);
  if (!types[file.type]) {
    return `Tipo de arquivo não permitido (${file.type}). Aceitos: ${Object.keys(types).join(", ")}`;
  }
  if (file.size > maxMbFor(kind) * 1024 * 1024) {
    return `Arquivo muito grande (máx ${maxMbFor(kind)}MB)`;
  }
  return null;
}

export async function saveFile(file: File, kind: UploadKind): Promise<string> {
  const ext = typesFor(kind)[file.type];
  const name = `${kind}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const subdir = kind === "documento" ? "documentos" : "audios";
  const dir = path.join(process.cwd(), UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  const publicBase = UPLOAD_DIR.replace(/^public[\\/]/, "");
  return `/${publicBase}/${subdir}/${name}`.replace(/\\/g, "/");
}
