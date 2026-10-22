import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ProjectCard, EmptyState } from "@/components/ui";
import { getCategories, getEntries } from "@/lib/content";
export const metadata: Metadata = { title: "作品", alternates: { canonical: "/work" } };
export default async function Work({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, entries, categories] = await Promise.all([searchParams, getEntries("project"), getCategories()]);
  const filtered = entries.filter(e => !category || e.categories.some(c => c.slug === category));
  return <div className="page-shell work-index"><PageIntro index="01" en="SELECTED WORK" title="作品档案" description="从一个想法开始，留下过程，也留下结果。"/><div className="filter-bar"><nav aria-label="作品分类" className="filter-tabs"><Link aria-current={!category ? "page" : undefined} href="/work">全部作品 <span>{entries.length.toString().padStart(2, "0")}</span></Link>{categories.map(c => <Link key={c.id} href={`/work?category=${c.slug}`} aria-current={category === c.slug ? "page" : undefined}>{c.name}</Link>)}</nav><span className="mono filter-note">EXPERIMENTS / PROJECTS</span></div>{filtered.length ? <div className="project-grid work-grid">{filtered.map((p, i) => <ProjectCard entry={p} index={i} key={p.id}/>)}</div> : <EmptyState title="这个分类暂时没有作品" href="/work" label="查看全部作品"/>}<div className="end-note mono"><span>THE ARCHIVE IS STILL GROWING.</span><span>持续更新中</span></div></div>;
}
