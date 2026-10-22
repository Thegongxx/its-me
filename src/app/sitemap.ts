import type { MetadataRoute } from "next";
import { getEntries, isDemo } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; if (isDemo() || process.env.VERCEL_ENV === "preview") return []; const entries = await getEntries(); return [...["", "/work", "/learn", "/about"].map(path => ({ url: site + path })), ...entries.map(e => ({ url: `${site}/${e.kind === "project" ? "work" : "learn"}/${e.slug}`, lastModified: new Date(e.updated_at) }))]; }
