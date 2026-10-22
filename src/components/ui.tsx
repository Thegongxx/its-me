import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Asterisk } from "lucide-react";
import { dateLabel, readingMinutes } from "@/lib/format";
import { mediaUrl } from "@/lib/content";
import type { Entry } from "@/lib/types";
export function Eyebrow({ children, number }: { children: React.ReactNode; number?: string }) { return <div className="eyebrow"><span className="tiny-square"/>{children}{number && <span className="eyebrow-number">{number}</span>}</div>; }
export function SectionTitle({ number, title, en, href, linkLabel }: { number: string; title: string; en: string; href?: string; linkLabel?: string }) {
  return <div className="section-title"><div><span className="mono section-index">{number} / {en}</span><h2>{title}<span className="accent-period">.</span></h2></div>{href && <Link className="text-link" href={href}>{linkLabel ?? "查看全部"}<ArrowUpRight size={18}/></Link>}</div>;
}
export function PageIntro({ index, en, title, description, children }: { index: string; en: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-intro"><Eyebrow number={index}>{en}</Eyebrow><div className="intro-row"><h1>{title}<span className="accent-period">.</span></h1><div className="intro-description"><p>{description}</p>{children}</div></div></div>;
}
export function EmptyState({ title = "下一份记录，正在路上。", description = "内容发布后会出现在这里。", href, label }: { title?: string; description?: string; href?: string; label?: string }) {
  return <div className="empty-state"><Asterisk size={40} strokeWidth={1}/><h2>{title}</h2><p>{description}</p>{href && <Link className="text-link" href={href}>{label ?? "返回目录"}<ArrowRight size={16}/></Link>}</div>;
}
export function ProjectCard({ entry, index, large = false }: { entry: Entry; index: number; large?: boolean }) {
  const cover = mediaUrl(entry.cover_path);
  return <article className={`project-card ${large ? "project-large" : ""}`}>
    <Link href={`/work/${entry.slug}`} className={`project-image theme-${entry.theme}`} aria-label={`查看项目：${entry.title}`}>
      <span className="project-code mono">{String(index + 1).padStart(2, "0")}</span>{entry.demo && <span className="cover-demo mono">示例项目</span>}
      {cover ? <Image src={cover} alt={`${entry.title}${entry.demo ? "概念示意图" : "项目封面"}`} fill sizes={large ? "(max-width: 760px) 100vw, 70vw" : "(max-width: 760px) 100vw, 50vw"} unoptimized className="cover-art"/> : <span className="cover-placeholder">{entry.title.slice(0, 2)}<Asterisk size={72}/></span>}
      <span className="project-open" aria-hidden="true"><ArrowUpRight size={24}/></span>
    </Link>
    <div className="project-meta"><div><h3><Link href={`/work/${entry.slug}`}>{entry.title}</Link></h3><p>{entry.summary}</p></div><span className="mono project-year">{entry.year || "—"}</span></div>
    <div className="tags">{entry.categories.map(c => <Link href={`/work?category=${c.slug}`} className="tag" key={c.id}>{c.name}</Link>)}</div>
  </article>;
}
export function LearningRow({ entry, index }: { entry: Entry; index: number }) {
  return <article className="learning-row"><span className="mono learning-index">{String(index + 1).padStart(2, "0")}</span><div className="learning-copy"><div className="learning-label"><span>{entry.categories.map(c => c.name).join(" / ") || "学习笔记"}</span>{entry.demo && <span className="demo-inline">示例</span>}</div><h3><Link href={`/learn/${entry.slug}`}>{entry.title}</Link></h3><p>{entry.summary}</p><div className="mono learning-date">{dateLabel(entry.published_at)} <span>·</span> {readingMinutes(entry.body)} MIN READ</div></div><Link className="learning-arrow icon-button" href={`/learn/${entry.slug}`} aria-label={`阅读：${entry.title}`}><ArrowUpRight size={24}/></Link></article>;
}
