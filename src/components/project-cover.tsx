import Image from "next/image";
import { ViewTransition } from "react";
import { mediaUrl } from "@/lib/content";
import type { Entry } from "@/lib/types";

export function ProjectCover({ entry, sizes = "100vw", eager = false }: { entry: Entry; sizes?: string; eager?: boolean }) {
  const src = mediaUrl(entry.cover_path);
  return <ViewTransition name={`project-cover-${entry.id}`} default="none" share="cover-morph">
    <div className={`cover-surface theme-${entry.theme}`}>
      {src ? <Image src={src} alt={`${entry.title}${entry.demo ? " · 示例概念图" : " · 项目封面"}`} fill sizes={sizes} loading={eager ? "eager" : "lazy"} unoptimized/> : <span className="cover-fallback">{entry.title}</span>}
    </div>
  </ViewTransition>;
}
