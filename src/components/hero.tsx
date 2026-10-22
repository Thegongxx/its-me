import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SceneStage } from "@/components/scene-stage";
import { StatusPanel } from "@/components/status-panel";
import { dateLabel } from "@/lib/format";
import { mediaUrl } from "@/lib/content";
import type { Entry, Profile, PublicStatus } from "@/lib/types";

export function Hero({ profile, projects, notes, status, demo }: {
  profile: Profile; projects: Entry[]; notes: Entry[]; status: PublicStatus | null; demo: boolean;
}) {
  return <><div className="home-story" id="home-story">
    <SceneStage/>
    <div className="story-chapters">
    <section className="story-section home-hero" id="hello" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-greeting">你好，我是</p>
        <h1 id="hero-title">Xuan<span>.</span></h1>
        <p className="hero-intro">{profile.bio}</p>
        <Link href="/about" className="underlined-link">认识一下 <ArrowUpRight size={18}/></Link>
      </div>
      <div className="hero-bottomline">
        <StatusPanel initial={status} demo={demo}/>
        <a href="#selected-work" className="scroll-invitation"><span>往下看看</span><ArrowDown size={23} strokeWidth={1.4}/></a>
      </div>
    </section>
    <section className="story-section chapter-work" id="selected-work" aria-labelledby="work-chapter-title">
      <div className="chapter-copy">
        <span className="chapter-label"><span className="mono">01</span> 作品</span>
        <h2 id="work-chapter-title">做过什么<span>。</span></h2>
        <p className="chapter-intro">一些想法，和让它们发生的过程。</p>
        <div className="home-projects">{projects.length ? projects.slice(0, 2).map(entry => {
          const cover = mediaUrl(entry.cover_path);
          return <Link className="home-project" key={entry.id} href={`/work/${entry.slug}`}>
            {cover && <span className={`home-project-cover theme-${entry.theme}`}><Image src={cover} alt="" width={92} height={72} unoptimized/></span>}
            <span className="home-project-text"><strong>{entry.title}</strong><small>{entry.categories.map(c => c.name).join(" / ")}{entry.demo && " · 示例"}</small></span>
            <ArrowUpRight size={20}/>
          </Link>;
        }) : <p className="home-empty">第一份作品，待发布。</p>}</div>
        <Link href="/work" className="underlined-link">全部作品 <ArrowUpRight size={18}/></Link>
      </div>
    </section>
    <section className="story-section chapter-learn" id="latest-notes" aria-labelledby="learn-chapter-title">
      <div className="chapter-copy">
        <span className="chapter-label"><span className="mono">02</span> 学习</span>
        <h2 id="learn-chapter-title">最近在学<span>。</span></h2>
        <p className="chapter-intro">写下来，是为了下次想起。</p>
        <div className="home-notes">{notes.length ? notes.slice(0, 3).map(entry => <Link className="home-note" href={`/learn/${entry.slug}`} key={entry.id}>
          <span className="mono">{dateLabel(entry.published_at)}{entry.demo && <small>示例</small>}</span>
          <strong>{entry.title}</strong><ArrowUpRight size={19}/>
        </Link>) : <p className="home-empty">第一篇笔记，待发布。</p>}</div>
        <Link href="/learn" className="underlined-link">全部学习记录 <ArrowUpRight size={18}/></Link>
      </div>
    </section>
    </div>
  </div><footer className="home-end"><Link href="/about">更多关于我 <ArrowUpRight size={16}/></Link><span>{demo ? "预览 · 作品和学习内容为示例" : "© 2026 Xuan"}</span><a href="#hello">回到顶部 ↑</a></footer></>;
}
