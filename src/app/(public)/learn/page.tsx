import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro, LearningRow, EmptyState } from "@/components/ui";
import { getCategories, getEntries } from "@/lib/content";

export const metadata: Metadata = { title: "学习笔记", alternates: { canonical: "/learn" } };
export default async function Learn({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const [{ category, q }, entries, categories] = await Promise.all([searchParams, getEntries("learn"), getCategories()]);
  const filtered = entries.filter(e => (!category || e.categories.some(c => c.slug === category)) && (!q || `${e.title} ${e.summary} ${e.body}`.toLowerCase().includes(q.toLowerCase())));
  return <div className="page-shell notes-index"><PageIntro index="02" en="FIELD NOTES" title="思考留痕" description="遇到的问题、试过的方法，还有没想明白的事。"/>
    <div className="learn-layout"><aside className="learn-sidebar"><span className="mono">按主题浏览</span><nav className="topic-nav" aria-label="知识分类">
      <Link href="/learn" aria-current={!category ? "page" : undefined}><span>全部记录</span><span className="mono">{entries.length.toString().padStart(2, "0")}</span></Link>
      {categories.map(c => <Link href={`/learn?category=${c.slug}`} key={c.id} aria-current={category === c.slug ? "page" : undefined}><span>{c.name}</span><span className="mono">{entries.filter(e => e.categories.some(t => t.id === c.id)).length.toString().padStart(2, "0")}</span></Link>)}
    </nav></aside><div>
      <form className="search-form" action="/learn">{category && <input type="hidden" name="category" value={category}/>}<label className="sr-only" htmlFor="note-search">搜索学习记录</label><input id="note-search" name="q" placeholder="搜索笔记…" defaultValue={q ?? ""} maxLength={100}/><button type="submit">搜索 ↗</button></form>
      <div className="list-caption mono"><span>{q ? `搜索：${q}` : "按发布时间排序"}</span><span>{filtered.length} 篇</span></div>
      {filtered.length ? filtered.map((e, i) => <LearningRow entry={e} index={i} key={e.id}/>) : <EmptyState title="没有找到相关笔记" description="换一个关键词，或查看全部记录。" href="/learn" label="全部记录"/>}
    </div></div><div className="end-note"><span>写下来，慢慢想。</span><Link href="/work">看看这些知识用在了哪里 ↗</Link></div>
  </div>;
}
