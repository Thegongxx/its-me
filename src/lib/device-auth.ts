import { createHash, randomBytes, randomUUID } from "node:crypto";
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function createDeviceCredential() { const id = randomUUID(); const token = `bl_${id}.${randomBytes(32).toString("hex")}`; return { id, token, hash: hashToken(token) }; }
export function parseDeviceCredential(header: string | null) {
  const match = header?.match(/^Bearer (bl_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[0-9a-f]{64})$/);
  return match ? { id: match[2], hash: hashToken(match[1]) } : null;
}
