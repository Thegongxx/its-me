import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getEntry, getEntries } from "@/lib/content";
import { dateLabel, headingId, readingMinutes } from "@/lib/format";
import { Markdown } from "@/components/markdown";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const e = await getEntry("learn", slug); return { title: e?.title ?? "记录未找到", description: e?.summary, alternates: { canonical: `/learn/${slug}` } }; }
export default async function LearningDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const e = await getEntry("learn", slug); if (!e) notFound();
  const headings = [...e.body.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  const related = (await getEntries("project")).filter(p => p.categories.some(c => e.categories.some(t => t.id === c.id)));
  return <article className="page-shell reading-page"><Link className="text-link breadcrumb" href="/learn"><ArrowLeft size={15}/>返回全部笔记</Link><div className="reading-header"><div className="tags">{e.categories.map(c => <Link key={c.id} href={`/learn?category=${c.slug}`} className="tag">{c.name}</Link>)}{e.demo && <span className="tag demo-tag">示例记录</span>}</div><h1>{e.title}</h1><p>{e.summary}</p><div className="mono reading-meta">{dateLabel(e.published_at)}<span>·</span>{readingMinutes(e.body)} 分钟阅读</div></div><div className="reading-layout"><aside className="table-of-contents"><span className="mono">文章目录</span><nav aria-label="文章目录">{headings.map((h, i) => <a key={`${h}-${i}`} href={`#${headingId(h)}`}>{h}</a>)}</nav></aside><div>{e.demo && <div className="article-notice">这是用于预览阅读体验的示例，不是个人学习成果声明。</div>}<Markdown body={e.body}/>{related.length > 0 && <div className="related-projects"><span className="mono">关联作品</span>{related.map(p => <Link href={`/work/${p.slug}`} key={p.id}>{p.title}{p.demo && <small>示例</small>}<ArrowUpRight size={18}/></Link>)}</div>}</div></div></article>;
}
