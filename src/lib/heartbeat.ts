import { parseDeviceCredential } from "./device-auth";
import { heartbeatInput } from "./validation";
import { errorResponse, HttpError, json, readJson } from "./http";
export type HeartbeatArgs = { p_device_id: string; p_hash: string; p_sequence: number; p_category: string; p_state: string };
export async function receiveHeartbeat(request: Request, ingest: (args: HeartbeatArgs) => Promise<string>, allowLocal = false) {
  try {
    const url = new URL(request.url);
    if (url.protocol !== "https:" && !(allowLocal && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new HttpError(400, "HTTPS required");
    const credential = parseDeviceCredential(request.headers.get("authorization"));
    if (!credential) throw new HttpError(401, "Invalid device credential");
    const payload = heartbeatInput.parse(await readJson(request, 1024));
    const result = await ingest({ p_device_id: credential.id, p_hash: credential.hash, p_sequence: payload.sequence, p_category: payload.category, p_state: payload.state });
    if (result === "unauthorized") throw new HttpError(401, "Device credential expired, revoked or invalid");
    if (result === "disabled") throw new HttpError(409, "Sharing is disabled or this device is not selected");
    if (result === "replay") throw new HttpError(409, "Sequence must increase");
    if (result === "throttled") return new Response(JSON.stringify({ error: "Too many updates" }), { status: 429, headers: { "Retry-After": "3", "Cache-Control": "no-store", "Content-Type": "application/json" } });
    if (result === "invalid") throw new HttpError(400, "Invalid status");
    if (result !== "ok") throw new Error("Unexpected ingestion result");
    return json({ ok: true, heartbeat_seconds: 30, stale_after_seconds: 90 });
  } catch (error) { return errorResponse(error); }
}
