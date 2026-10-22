import { adminAccess } from "@/lib/auth";
import { isDemo } from "@/lib/content";
import { demoCategories, demoEntries, placeholderProfile } from "@/lib/demo";
import { Dashboard } from "@/components/admin/dashboard";
import { Login } from "@/components/admin/login";
import type { Category, Entry } from "@/lib/types";
export default async function Admin({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section = "overview" } = await searchParams;
  if (isDemo()) return <Dashboard demo entries={demoEntries} categories={demoCategories} profile={placeholderProfile} experiences={[]} devices={[]} settings={{ id: 1, enabled: false, active_device_id: null }} section={section}/>;
  const access = await adminAccess();
  if (access.state === "unconfigured") return <div className="login-card"><span className="mono">SETUP REQUIRED</span><h1>工作台，等待连接。</h1><p>请按 README 配置 Supabase 环境变量、执行迁移，并指定管理员账号。未配置时不开放登录或写入。</p></div>;
  if (access.state === "anonymous") return <Login/>;
  if (access.state === "denied") return <Login denied/>;
  const db = access.supabase;
  const results = await Promise.all([
    db.from("entries").select("*, entry_categories(categories(*))").order("updated_at", { ascending: false }),
    db.from("categories").select("*").order("name"), db.from("profiles").select("*").eq("id", 1).single(),
    db.from("experiences").select("*").order("sort_order"),
    db.from("devices").select("id,label,created_at,expires_at,last_seen_at,revoked_at").order("created_at", { ascending: false }),
    db.from("sharing_settings").select("*").eq("id", 1).single()
  ]);
  if (results.some(r => r.error)) throw new Error("无法读取后台资料，请检查迁移与权限配置。");
  const entries = results[0].data!.map(row => ({ ...row, categories: (row.entry_categories ?? []).map((link: { categories: Category | null }) => link.categories).filter(Boolean) })) as Entry[];
  return <Dashboard demo={false} entries={entries} categories={results[1].data ?? []} profile={results[2].data} experiences={results[3].data ?? []} devices={results[4].data ?? []} settings={results[5].data} section={section}/>;
}
