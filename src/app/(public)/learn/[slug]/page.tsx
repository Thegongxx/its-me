import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getEntry, getEntries } from "@/lib/content";
import { dateLabel, readingMinutes } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { ReadingGuide } from "@/components/reading-guide";
import { NextEntry } from "@/components/next-entry";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const e = await getEntry("learn", slug); return { title: e?.title ?? "记录未找到", description: e?.summary, alternates: { canonical: `/learn/${slug}` } }; }
export default async function LearningDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const e = await getEntry("learn", slug); if (!e) notFound();
  const [projects, notes] = await Promise.all([getEntries("project"), getEntries("learn")]);
  const related = projects.filter(p => p.categories.some(c => e.categories.some(t => t.id === c.id)));
  const next = notes.length > 1 ? notes[(notes.findIndex(note => note.id === e.id) + 1) % notes.length] : undefined;
  return <article className="page-shell reading-page">
    <Link className="text-link breadcrumb" href="/learn"><ArrowLeft size={15}/>返回全部笔记</Link>
    <header className="reading-header">
      <div className="tags">{e.categories.map(c => <Link key={c.id} href={`/learn?category=${c.slug}`} className="tag">{c.name}</Link>)}{e.demo && <span className="tag demo-tag">示例记录</span>}</div>
      <h1>{e.title}</h1><p>{e.summary}</p>
      <div className="mono reading-meta">{dateLabel(e.published_at)}<span>·</span>{readingMinutes(e.body)} 分钟阅读</div>
    </header>
    <div className="reading-layout">
      <ReadingGuide key={e.id} contentId="note-content"/>
      <div>
        {e.demo && <div className="article-notice">这是用于预览阅读体验的示例，不是个人学习成果声明。</div>}
        <div id="note-content"><Markdown body={e.body}/></div>
        {related.length > 0 && <div className="related-projects"><span className="mono">关联作品</span>{related.map(p => <Link href={`/work/${p.slug}`} key={p.id}>{p.title}{p.demo && <small>示例</small>}<ArrowUpRight size={18}/></Link>)}</div>}
      </div>
    </div>
    <NextEntry entry={next}/>
  </article>;
}
