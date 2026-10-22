import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ProjectCard, EmptyState } from "@/components/ui";
import { getCategories, getEntries } from "@/lib/content";
export const metadata: Metadata = { title: "作品", alternates: { canonical: "/work" } };
export default async function Work({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [{ category }, entries, categories] = await Promise.all([searchParams, getEntries("project"), getCategories()]);
  const filtered = entries.filter(e => !category || e.categories.some(c => c.slug === category));
  return <div className="page-shell work-index"><PageIntro index="" en="Selected work." title="作品选集" description="项目、实验，以及它们背后的过程。"/><div className="filter-bar"><nav aria-label="作品分类" className="filter-tabs"><Link aria-current={!category ? "page" : undefined} href="/work">全部作品 <span>{entries.length}</span></Link>{categories.map(c => <Link key={c.id} href={`/work?category=${c.slug}`} aria-current={category === c.slug ? "page" : undefined}>{c.name}</Link>)}</nav></div>{filtered.length ? <div className="project-grid work-grid">{filtered.map((p, i) => <ProjectCard entry={p} index={i} key={p.id}/>)}</div> : <EmptyState title="这个分类暂时没有作品" href="/work" label="查看全部作品"/>}</div>;
}
