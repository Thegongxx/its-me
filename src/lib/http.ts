import { ZodError } from "zod";
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); }
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof ZodError) return json({ error: "输入不符合要求", details: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).slice(0, 8) }, 400);
  if (error instanceof SyntaxError) return json({ error: "请求格式无效" }, 400);
  console.error("API operation failed", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "服务暂时不可用，请稍后重试" }, 503);
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  if (!origin || origin !== expected) throw new HttpError(403, "请求来源未获授权");
}
export async function readBytes(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) throw new HttpError(413, "请求过大");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "缺少请求内容");
  let length = 0; const chunks: Uint8Array[] = [];
  try { while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > maxBytes) { await reader.cancel(); throw new HttpError(413, "请求过大"); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export async function readJson(request: Request, maxBytes = 450000) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new HttpError(415, "需要 JSON 请求");
  return JSON.parse(new TextDecoder().decode(await readBytes(request, maxBytes)));
}
