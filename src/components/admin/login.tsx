"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
export function Login({ denied = false }: { denied?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  return <div className="login-card"><span className="mono">{denied ? "ACCESS DENIED / 403" : "OWNER ACCESS"}</span><h1>{denied ? "这个账号还没有钥匙。" : "回到构建现场。"}</h1><p>{denied ? "你已经登录，但不在指定管理员名单中。请由项目所有者核对 Auth 用户 UUID。" : "使用已授权的管理员账号登录。登录成功后，仍会单独检查管理权限。"}</p>{denied ? <button className="button button-dark" onClick={async () => { await browserClient()?.auth.signOut(); router.refresh(); }}>退出并切换账号 ↗</button> : <form onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(e.currentTarget); try { const client = browserClient(); if (!client) throw new Error(); const { error } = await client.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) }); if (error) setMessage("登录失败，请检查邮箱和密码，或稍后再试。"); else router.refresh(); } catch { setMessage("暂时无法连接登录服务。"); } finally { setBusy(false); } }}>
      <label>邮箱<input name="email" type="email" autoComplete="username" required placeholder="你的管理员邮箱" maxLength={254}/></label><label>密码<input name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={128}/></label><button disabled={busy} className="button button-dark" type="submit">{busy ? "正在验证…" : "登录工作台 ↗"}</button><p role="status" className="form-message">{message}</p></form>}<span className="login-note">管理员名单由数据库单独维护。此处不提供公开注册。</span></div>;
}
