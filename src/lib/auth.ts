import "server-only";
import { configured, sessionClient } from "./supabase/server";
import { HttpError } from "./http";
export async function adminAccess() {
  if (process.env.DEMO_MODE === "true" || !configured()) return { state: "unconfigured" as const };
  const supabase = await sessionClient();
  // Verify with Auth, never trust an unverified session object or user-editable metadata.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { state: "anonymous" as const };
  const { data: allowed, error: authorizationError } = await supabase.rpc("is_admin");
  if (authorizationError) throw new HttpError(503, "管理员授权服务暂时不可用");
  if (allowed !== true) return { state: "denied" as const };
  return { state: "authorized" as const, supabase, user };
}
export async function requireAdmin() {
  const access = await adminAccess();
  if (access.state === "unconfigured") throw new HttpError(503, "当前为预览模式或尚未配置数据库，写入未启用");
  if (access.state === "anonymous") throw new HttpError(401, "请先登录");
  if (access.state === "denied") throw new HttpError(403, "已登录，但此账号没有管理员权限");
  return access;
}
