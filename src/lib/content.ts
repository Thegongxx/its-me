import "server-only";
import { cache } from "react";
import { publicClient } from "./supabase/server";
import { demoCategories, demoEntries, placeholderProfile } from "./demo";
import type { Category, Entry, Experience, Profile, PublicStatus } from "./types";

export const isDemo = () => process.env.DEMO_MODE === "true";
function checked<T>(data: T, error: { message: string } | null): T {
  if (error) { console.error("Content query failed", error.message); throw new Error("内容暂时无法加载，请稍后重试。"); }
  return data;
}
export const getProfile = cache(async (): Promise<Profile> => {
  if (isDemo()) return placeholderProfile;
  const { data, error } = await publicClient().from("profiles").select("*").eq("id", 1).eq("published", true).maybeSingle();
  return checked(data, error) ?? { ...placeholderProfile, bio: "个人资料即将更新。", introduction: "个人介绍待填写。" };
});
export const getCategories = cache(async (): Promise<Category[]> => {
  if (isDemo()) return demoCategories;
  const { data, error } = await publicClient().from("categories").select("*").eq("published", true).order("name");
  return checked(data, error) ?? [];
});
export const getEntries = cache(async (kind?: "project" | "learn"): Promise<Entry[]> => {
  if (isDemo()) return demoEntries.filter(e => !kind || e.kind === kind);
  let query = publicClient().from("entries").select("*, entry_categories(categories(*))").eq("status", "published").order("published_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  return (checked(data, error) ?? []).map(row => ({ ...row, categories: (row.entry_categories ?? []).map((link: { categories: Category | null }) => link.categories).filter(Boolean) })) as Entry[];
});
export const getEntry = cache(async (kind: "project" | "learn", slug: string) => (await getEntries(kind)).find(e => e.slug === slug));
export const getExperiences = cache(async (): Promise<Experience[]> => {
  if (isDemo()) return [];
  const { data, error } = await publicClient().from("experiences").select("*").eq("published", true).order("sort_order");
  return checked(data, error) ?? [];
});
export async function getPublicStatus(): Promise<PublicStatus | null> {
  if (isDemo()) return null;
  const { data, error } = await publicClient().from("public_status").select("id,category,state,sharing,heartbeat_at,expires_at").eq("id", 1).maybeSingle();
  return checked(data, error);
}
export function mediaUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("/visuals/")) return path;
  return `/api/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
