import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CoverReel } from "@/components/cover-reel";
import { TiltCover } from "@/components/tilt-cover";
import { ProjectCover } from "@/components/project-cover";
import { JournalReveal } from "@/components/journal-reveal";
import { StatusPanel } from "@/components/status-panel";
import { LearningRow } from "@/components/ui";
import type { Entry, Profile, PublicStatus } from "@/lib/types";
import "./home.css";

export function Hero({ profile, projects, notes, status, demo }: {
  profile: Profile; projects: Entry[]; notes: Entry[]; status: PublicStatus | null; demo: boolean;
}) {
  return <div className="home-editorial">
    <noscript><style>{`.cover-reel .reel-opening { height: min(72svh, 650px); min-height: 450px; }.cover-reel .reel-sticky { position: relative; height: 100%; min-height: 0; }`}</style></noscript>
    <CoverReel>
      <div className="reel-opening"><div className="reel-sticky">
        <div className="reel-introduction">
          <p className="reel-greeting">你好，我是</p>
          <h1 className="reel-name">Xuan<em>.</em></h1>
          <p className="reel-bio">{profile.bio}</p>
          <Link className="editorial-link" href="/about">关于我 <ArrowUpRight size={16}/></Link>
        </div>
        <div className="reel-edition" aria-hidden="true"><span>PERSONAL<br/>COLLECTION</span><span className="edition-line"/><span>作品 · 记录 · 当下</span></div>
        <div className="reel-foot"><span>个人作品与学习记录</span><a href="#selected-work">展开作品册 <ArrowDown size={16}/></a></div>
        <div className="reel-track" aria-hidden="true"><span/></div>
      </div></div>

      <section className="home-selection" id="selected-work" aria-labelledby="selection-title">
        <div className="editorial-heading"><h2 id="selection-title"><span lang="en">Selected work</span><small>作品选集</small></h2><Link href="/work" className="editorial-link">全部作品 <ArrowUpRight size={17}/></Link></div>
        <div className="selection-grid">{projects.length ? projects.slice(0, 2).map((entry, index) => <article className="selected-project" key={entry.id}>
          <div className="selection-topic"><span>{String(index + 1).padStart(2, "0")}</span>{entry.categories.map(category => category.name).join(" / ") || "个人作品"}</div>
          <div className="cover-slot" data-cover-slot={index}>
            <div className="reel-cover" data-reel-cover={index}>
              <Link href={`/work/${entry.slug}`} prefetch={true} transitionTypes={["project-open"]} className="reel-picture" aria-label={`查看作品：${entry.title}`}>
                <TiltCover><ProjectCover entry={entry} sizes="(max-width: 760px) 88vw, 84vw" eager/>
                  {entry.demo && <span className="reel-demo">示例作品</span>}
                  <span className="reel-open" aria-hidden="true"><ArrowUpRight size={22}/></span>
                  <span className="cover-invitation" aria-hidden="true">查看案例</span>
                </TiltCover>
              </Link>
              <span className="reel-caption" aria-hidden="true"><span>{entry.title}</span><span>{entry.year}</span></span>
            </div>
          </div>
          <div className="selection-caption"><h3><Link href={`/work/${entry.slug}`} prefetch={true} transitionTypes={["project-open"]}>{entry.title}</Link></h3><span>{entry.year}</span></div>
          <p>{entry.summary}</p>
        </article>) : <p className="editorial-empty">作品整理中，发布后会出现在这里。</p>}</div>
      </section>
    </CoverReel>

    <JournalReveal>
      <section className="home-journal" id="latest-notes" aria-labelledby="journal-title">
        <div className="journal-intro"><span className="journal-eyebrow">THE OTHER SIDE / 随手记</span><h2 id="journal-title" lang="en">Notes<br/><em>& thoughts.</em></h2><p>写下遇到的问题，<br/>也留下解决问题的过程。</p><Link className="editorial-link" href="/learn">全部笔记 <ArrowUpRight size={17}/></Link></div>
        <div className="journal-entries">{notes.length ? notes.slice(0, 3).map((entry, i) => <LearningRow key={entry.id} entry={entry} index={i}/>) : <p className="editorial-empty">还没有发布的笔记。</p>}</div>
      </section>
    </JournalReveal>

    <section className="home-personal" aria-label="近况与联系"><div className="personal-status"><span className="personal-caption">屏幕的另一边</span><StatusPanel initial={status} demo={demo}/></div>
      <Link href="/about" className="personal-link"><span>很高兴在这里遇见你。</span><span className="personal-signature" lang="en">More about me <ArrowUpRight strokeWidth={1}/></span></Link>
    </section>
  </div>;
}
