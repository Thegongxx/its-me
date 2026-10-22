import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createDeviceCredential } from "@/lib/device-auth";
import { deviceInput, sharingInput } from "@/lib/validation";
import { errorResponse, HttpError, json, readJson, requireSameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); const { supabase } = await requireAdmin();
    const { label } = deviceInput.parse(await readJson(request, 1024));
    const credential = createDeviceCredential();
    const { error } = await supabase.from("devices").insert({ id: credential.id, label, token_hash: credential.hash });
    if (error) throw new HttpError(400, "设备创建失败");
    // Plaintext only returned once; never stored or logged.
    return json({ id: credential.id, token: credential.token }, 201);
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request); const { supabase } = await requireAdmin(); const input = sharingInput.parse(await readJson(request, 1024));
    const { error } = await supabase.rpc("change_sharing", { p_enabled: input.enabled, p_device_id: input.active_device_id });
    if (error) throw new HttpError(400, "共享设置未保存，请选择未撤销且未过期的设备");
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request); const { supabase } = await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).strict().parse(await readJson(request, 1024));
    const { error } = await supabase.rpc("revoke_device", { p_device_id: id });
    if (error) throw new HttpError(400, "撤销失败，请重试");
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
