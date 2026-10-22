import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { categoryInput, entryInput, experienceInput, profileInput } from "@/lib/validation";
import { errorResponse, HttpError, json, readJson, requireSameOrigin } from "@/lib/http";
const envelope = z.object({ type: z.enum(["entry", "profile", "experience", "category"]), data: z.unknown() }).strict();
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); const { supabase } = await requireAdmin();
    const input = envelope.parse(await readJson(request));
    let error: { message: string; code?: string } | null = null;
    if (input.type === "entry") {
      const { category_ids, ...entry } = entryInput.parse(input.data);
      ({ error } = await supabase.rpc("save_entry", { p_entry: entry, p_categories: category_ids }));
    } else if (input.type === "profile") ({ error } = await supabase.from("profiles").upsert(profileInput.parse(input.data)));
    else if (input.type === "experience") ({ error } = await supabase.from("experiences").upsert(experienceInput.parse(input.data)));
    else ({ error } = await supabase.from("categories").upsert(categoryInput.parse(input.data)));
    if (error?.code === "23505") throw new HttpError(409, "这个路径已被使用，请换一个 slug");
    if (error) throw new HttpError(400, "保存失败，请检查必填项、知识点关联及图片归属");
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
