import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { mediaUrl } from "@/lib/content";
import type { Entry } from "@/lib/types";

export function NextEntry({ entry }: { entry?: Entry }) {
  if (!entry) return null;
  const project = entry.kind === "project";
  const cover = project ? mediaUrl(entry.cover_path) : null;
  return <section className={`next-entry ${project ? "next-work" : "next-note"}`} aria-label={project ? "继续浏览作品" : "继续阅读"}>
    <div className="next-entry-label"><span lang="en">{project ? "Up next" : "Keep reading"}</span><span>{project ? "下一件作品" : "下一篇笔记"}</span></div>
    <Link href={`/${project ? "work" : "learn"}/${entry.slug}`} className="next-entry-link">
      <div className="next-entry-copy"><span className="next-entry-meta">{entry.categories.map(c => c.name).join(" / ")}{entry.demo && <small>示例</small>}</span><h2>{entry.title}</h2><p>{entry.summary}</p></div>
      {cover && <div className={`next-entry-cover theme-${entry.theme}`}><Image src={cover} alt="" fill unoptimized sizes="(max-width: 760px) 88vw, 20vw" loading="lazy"/></div>}
      <span className="next-entry-arrow" aria-hidden="true"><ArrowUpRight strokeWidth={1}/></span>
    </Link>
  </section>;
}
