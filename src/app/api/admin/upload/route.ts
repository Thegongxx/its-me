import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, HttpError, json, readBytes, requireSameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); const { supabase } = await requireAdmin();
    const entryId = z.uuid().parse(new URL(request.url).searchParams.get("entry"));
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(request.headers.get("content-type") || "")) throw new HttpError(415, "仅支持 JPEG、PNG、WebP、GIF 图片");
    const { data, error } = await supabase.from("entries").select("id").eq("id", entryId).maybeSingle();
    if (error || !data) throw new HttpError(400, "请先保存条目，再上传图片");
    const bytes = await readBytes(request, 4 * 1024 * 1024);
    const decoder = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
    const metadata = await decoder.metadata();
    if (!["jpeg", "png", "webp", "gif"].includes(metadata.format ?? "")) throw new HttpError(415, "图片内容格式不受支持");
    const image = await decoder.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    const path = `${entryId}/${randomUUID()}.webp`;
    const upload = await supabase.storage.from("project-media").upload(path, image, { contentType: "image/webp", cacheControl: "0", upsert: false });
    if (upload.error) throw new HttpError(400, "图片上传失败，请检查 Storage 策略");
    return json({ path, markdown: `![图片说明](/api/media/${path})` }, 201);
  } catch (error) { return errorResponse(error); }
}
