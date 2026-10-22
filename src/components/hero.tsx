import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CoverReel } from "@/components/cover-reel";
import { StatusPanel } from "@/components/status-panel";
import { LearningRow } from "@/components/ui";
import { mediaUrl } from "@/lib/content";
import type { Entry, Profile, PublicStatus } from "@/lib/types";
import "./home.css";

function Cover({ entry }: { entry: Entry }) {
  const src = mediaUrl(entry.cover_path);
  return src ? <Image src={src} alt={`${entry.title}${entry.demo ? " · 示例概念图" : "项目封面"}`} fill
    sizes="(max-width: 760px) 88vw, 65vw" loading="eager" unoptimized/> : <span className="cover-fallback">{entry.title}</span>;
}

export function Hero({ profile, projects, notes, status, demo }: {
  profile: Profile; projects: Entry[]; notes: Entry[]; status: PublicStatus | null; demo: boolean;
}) {
  return <div className="home-editorial">
    <CoverReel>
      <div className="reel-introduction">
        <p className="reel-greeting">你好，我是</p>
        <h1 className="reel-name">Xuan<em>.</em></h1>
        <p className="reel-bio">{profile.bio}</p>
        <Link className="editorial-link" href="/about">关于我 <ArrowUpRight size={16}/></Link>
      </div>
      <div className="reel-covers" aria-label="作品预览">
        {projects.slice(0, 2).map((entry, i) => <div className={`reel-cover reel-cover-${i}`} key={entry.id}>
          <Link href={`/work/${entry.slug}`} className={`reel-picture theme-${entry.theme}`} aria-label={`打开作品：${entry.title}`}>
            <Cover entry={entry}/>
            <span className="reel-open"><ArrowUpRight size={22}/></span>
            {entry.demo && <span className="reel-demo">示例作品</span>}
          </Link>
          <div className="reel-caption"><span>{entry.title}</span><span>{entry.year}</span></div>
        </div>)}
        {!projects.length && <div className="reel-awaiting"><span>Work in progress.</span><p>作品整理中</p></div>}
      </div>
      <div className="reel-foot"><span>个人作品与学习记录</span><a href="#selected-work">往下看看 <ArrowDown size={16}/></a></div>
    </CoverReel>

    <section className="home-selection" id="selected-work" aria-labelledby="selection-title">
      <div className="editorial-heading"><h2 id="selection-title"><span lang="en">Selected work</span><small>作品选集</small></h2><Link href="/work" className="editorial-link">全部作品 <ArrowUpRight size={17}/></Link></div>
      <div className="selection-grid">{projects.length ? projects.slice(0, 2).map(entry => <article className="selected-project" key={entry.id}>
        <Link className={`selected-image theme-${entry.theme}`} href={`/work/${entry.slug}`} aria-label={`查看作品：${entry.title}`}>
          <Cover entry={entry}/>{entry.demo && <span className="reel-demo">示例作品</span>}<span className="reel-open"><ArrowUpRight size={22}/></span>
        </Link>
        <div className="selection-caption"><h3><Link href={`/work/${entry.slug}`}>{entry.title}</Link></h3><span>{entry.year}</span></div>
        <p>{entry.summary}</p>
      </article>) : <p className="editorial-empty">作品整理中，发布后会出现在这里。</p>}</div>
    </section>

    <section className="home-journal" id="latest-notes" aria-labelledby="journal-title">
      <div className="journal-intro"><h2 id="journal-title" lang="en">Notes<br/><em>& thoughts.</em></h2><p>写下遇到的问题，<br/>也留下解决问题的过程。</p><Link className="editorial-link" href="/learn">全部笔记 <ArrowUpRight size={17}/></Link></div>
      <div className="journal-entries">{notes.length ? notes.slice(0, 3).map((entry, i) => <LearningRow key={entry.id} entry={entry} index={i}/>) : <p className="editorial-empty">还没有发布的笔记。</p>}</div>
    </section>

    <section className="home-personal" aria-label="近况与联系"><div className="personal-status"><span className="personal-caption">屏幕的另一边</span><StatusPanel initial={status} demo={demo}/></div>
      <Link href="/about" className="personal-link"><span>很高兴在这里遇见你。</span><span className="personal-signature" lang="en">More about me <ArrowUpRight strokeWidth={1}/></span></Link>
    </section>
  </div>;
}
