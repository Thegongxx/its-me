import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SceneStage } from "@/components/scene-stage";
import { TiltSurface } from "@/components/tilt-surface";
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
      <p className="hero-kicker mono"><i/> A PERSONAL WORK IN PROGRESS</p>
      <div className="hero-copy">
        <div className="hero-identity">
        <p className="hero-greeting">你好，我是</p>
        <h1 id="hero-title">Xuan<span>.</span></h1>
        </div>
        <div className="hero-description">
        <p className="hero-statement">把想法，慢慢做出来。</p>
        <p className="hero-intro">{profile.bio}</p>
        <Link href="/about" className="underlined-link">认识一下 <ArrowUpRight size={18}/></Link>
        </div>
      </div>
      <div className="hero-bottomline">
        <StatusPanel initial={status} demo={demo}/>
        <a href="#selected-work" className="scroll-invitation"><span className="mono">SCROLL TO EXPLORE</span><ArrowDown size={23} strokeWidth={1.4}/></a>
      </div>
    </section>
    <section className="story-section chapter-work" id="selected-work" aria-labelledby="work-chapter-title">
      <div className="gallery-heading">
        <div><span className="chapter-label"><span className="mono">01 / THE GALLERY</span> 作品陈列</span>
        <h2 id="work-chapter-title">想法的另一面<span>。</span></h2></div>
        <p>做过的，正在做的。<br/>点开一件作品，看看它如何发生。</p>
      </div>
      <div className="home-gallery">{projects.length ? projects.slice(0, 2).map((entry, index) => {
          const cover = mediaUrl(entry.cover_path);
          return <TiltSurface className="gallery-surface" key={entry.id}><Link className="gallery-exhibit" href={`/work/${entry.slug}`}>
            <div className={`gallery-image theme-${entry.theme}`}>
              {cover ? <Image src={cover} alt={`${entry.title}${entry.demo ? "概念示意图" : "项目封面"}`} fill sizes="(max-width: 760px) 90vw, 45vw" unoptimized/> : <span className="gallery-placeholder">{entry.title.slice(0, 2)}</span>}
              <span className="exhibit-number mono">{String(index + 1).padStart(2, "0")}</span>
              {entry.demo && <span className="exhibit-demo mono">示例作品</span>}
              <span className="exhibit-open">进入作品 <ArrowUpRight size={18}/></span>
            </div>
            <div className="exhibit-label"><div><h3>{entry.title}</h3><p>{entry.categories.map(c => c.name).join(" / ")}</p></div><ArrowUpRight size={24} strokeWidth={1.3}/></div>
          </Link></TiltSurface>;
        }) : <p className="home-empty">第一份作品，待发布。</p>}</div>
      <Link href="/work" className="underlined-link gallery-all">进入作品档案 <ArrowUpRight size={18}/></Link>
    </section>
    <section className="story-section chapter-learn" id="latest-notes" aria-labelledby="learn-chapter-title">
      <div className="chapter-copy">
        <span className="chapter-label"><span className="mono">02 / ON MY DESK</span> 学习桌面</span>
        <h2 id="learn-chapter-title">想法，<br/>还在生长<span>。</span></h2>
        <p className="chapter-intro">有时是一个答案，<br/>有时，是一个更好的问题。</p>
        <Link href="/learn" className="underlined-link">翻开全部笔记 <ArrowUpRight size={18}/></Link>
      </div>
      <div className="home-notebook">{notes.length ? notes.slice(0, 3).map((entry, index) => <Link className="note-slip" href={`/learn/${entry.slug}`} key={entry.id}>
        <div className="slip-meta mono"><span>{String(index + 1).padStart(2, "0")} / {dateLabel(entry.published_at)}</span>{entry.demo && <span>示例笔记</span>}</div>
        <h3>{entry.title}</h3><p>{entry.summary}</p><span className="slip-read">继续阅读 <ArrowUpRight size={18}/></span>
      </Link>) : <p className="home-empty">第一篇笔记，待发布。</p>}</div>
    </section>
    </div>
  </div><footer className="home-end"><Link href="/about" className="home-signoff">未完，待续。<ArrowUpRight strokeWidth={1.2}/><span>更多关于我</span></Link><div className="home-colophon"><span>{demo ? "预览 · 作品和学习内容为示例" : "© 2026 Xuan"}</span><a href="#hello">回到顶部 ↑</a></div></footer></>;
}
