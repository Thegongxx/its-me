"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { statusView } from "@/lib/status";
import type { PublicStatus } from "@/lib/types";
export function StatusPanel({ initial, demo }: { initial: PublicStatus | null; demo: boolean }) {
  const [status, setStatus] = useState(initial);
  const [now, setNow] = useState<number | null>(null);
  const clock = useRef<{ server: number; monotonic: number } | null>(null);
  const [connection, setConnection] = useState(demo ? "预览模式" : "正在连接");
  const refresh = useCallback(async () => {
    if (demo) return;
    try { const response = await fetch("/api/status", { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json(); if (!Number.isFinite(data.server_time)) throw new Error(); clock.current = { server: data.server_time, monotonic: performance.now() }; setStatus(data.status); setNow(data.server_time); } catch { setConnection("连接暂时中断"); }
  }, [demo]);
  useEffect(() => {
    const tick = () => { if (clock.current) setNow(clock.current.server + performance.now() - clock.current.monotonic); };
    const timer = setInterval(tick, 1000);
    if (demo) return () => clearInterval(timer);
    const supabase = browserClient();
    void refresh();
    const channel = supabase?.channel("public-status").on("postgres_changes", { event: "*", schema: "public", table: "public_status", filter: "id=eq.1" }, () => { void refresh(); }).subscribe(state => {
      setConnection(state === "SUBSCRIBED" ? "实时连接" : state === "CHANNEL_ERROR" || state === "TIMED_OUT" ? "正在重连" : "正在连接");
      if (state === "SUBSCRIBED") void refresh();
    });
    const poll = setInterval(() => { void refresh(); }, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") { tick(); void refresh(); } };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);
    return () => { clearInterval(timer); clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", refresh); if (channel && supabase) void supabase.removeChannel(channel); };
  }, [demo, refresh]);
  // Never advertise a live heartbeat until the client has checked its actual clock.
  const view = statusView(status, now ?? Number.POSITIVE_INFINITY);
  return <div id="now" className="now-line" data-state={view.mode} title={connection}>
    <span className="now-label">此刻</span><span className={`now-dot ${view.live ? "is-live" : ""}`} aria-hidden="true"/>
    <p role="status" aria-live="polite">{view.label}{view.live && <span className="now-category"> · {view.description}</span>}</p>
  </div>;
}
