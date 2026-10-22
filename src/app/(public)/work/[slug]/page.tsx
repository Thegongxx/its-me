import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getEntry, getEntries, mediaUrl } from "@/lib/content";
import { Markdown } from "@/components/markdown";
import { LearningRow, SectionTitle } from "@/components/ui";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const e = await getEntry("project", slug); return { title: e?.title ?? "项目未找到", description: e?.summary, alternates: { canonical: `/work/${slug}` } }; }
export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const entry = await getEntry("project", slug); if (!entry) notFound();
  const related = (await getEntries("learn")).filter(n => n.categories.some(c => entry.categories.some(t => t.id === c.id))).slice(0, 3);
  const cover = mediaUrl(entry.cover_path);
  return <article className="page-shell detail-page"><Link className="text-link breadcrumb" href="/work"><ArrowLeft size={15}/>返回作品档案</Link><div className="detail-title"><span className="mono">PROJECT FILE / {entry.year || "—"}{entry.demo && " / 示例项目"}</span><h1>{entry.title}<span className="accent-period">.</span></h1><p>{entry.summary}</p></div>{cover && <div className={`detail-cover theme-${entry.theme}`}><Image src={cover} alt={`${entry.title}${entry.demo ? "原创概念封面" : "封面"}`} fill unoptimized priority sizes="100vw"/>{entry.demo && <span className="cover-demo mono">ILLUSTRATIVE CONCEPT / 非真实项目截图</span>}</div>}
    <div className="project-article-grid"><aside className="project-facts"><div><span className="mono">MY ROLE</span><p>{entry.role || "职责待填写"}</p></div><div><span className="mono">CONNECTIONS</span><div className="tags">{entry.categories.map(c => <Link href={`/learn?category=${c.slug}`} className="tag" key={c.id}>{c.name}</Link>)}</div></div><div><span className="mono">EVIDENCE</span>{entry.external_url && <a className="text-link" href={entry.external_url} target="_blank" rel="noopener noreferrer">访问项目 <ArrowUpRight size={15}/></a>}{entry.repository_url && <a className="text-link" href={entry.repository_url} target="_blank" rel="noopener noreferrer">源代码 <ArrowUpRight size={15}/></a>}{!entry.external_url && !entry.repository_url && <p>项目证据待补充</p>}</div></aside><div>{entry.demo && <div className="article-notice">示例档案：以下内容演示案例结构，不代表个人经历或已完成成果。</div>}<Markdown body={entry.body}/></div></div>
    {related.length > 0 && <section className="related-section"><SectionTitle number="↳" en="CONNECTED NOTES" title="与这份作品有关的思考"/>{related.map((e, i) => <LearningRow entry={e} index={i} key={e.id}/>)}</section>}</article>;
}
