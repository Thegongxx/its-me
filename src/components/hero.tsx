import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { HomeScene } from "@/components/home-scene";
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
  return <div className="home-gallery">
    <noscript><style>{".home-scene { height: 100svh; min-height: 650px; } .scene-sticky { position: relative; } .home-selection { margin-top: 0; }"}</style></noscript>
    <HomeScene artwork={<Image src="/visuals/open-form.webp" alt="" width={1254} height={1254} sizes="(max-width: 760px) 96vw, 68vw" preload className="scene-sculpture"/>}>
      <div className="scene-heading">
        <p className="scene-eyebrow"><span/> A PERSONAL UNIVERSE <span className="scene-issue">正在构建中的我</span></p>
        <h1 className="scene-name">Xuan<span className="scene-period">.</span></h1>
        <p className="scene-statement">想法，<em>正在成形。</em></p>
      </div>
      <div className="scene-foot">
        <p className="scene-bio">{profile.bio}</p>
        <Link className="scene-enter" href="/#selected-work"><span>向下探索<span lang="en">SCROLL TO DISCOVER</span></span><span className="scene-enter-icon"><ArrowDown strokeWidth={1.3} size={24}/></span></Link>
      </div>
      <span className="scene-side-note" aria-hidden="true">ALWAYS IN THE MAKING — XUAN</span>
    </HomeScene>

    <section className="home-selection" id="selected-work" aria-labelledby="selection-title">
      <div className="section-kicker"><span>01 / 作品集</span><span>IDEAS INTO REALITY</span></div>
      <div className="editorial-heading"><h2 id="selection-title" lang="en">A few things<br/><em>I&apos;ve made.</em></h2><div className="selection-intro"><p>把想法落到实处，<br/>再让作品自己说话。</p><Link href="/work" className="editorial-link">浏览作品集 <ArrowUpRight size={18}/></Link></div></div>
      <div className="selection-grid">{projects.length ? projects.slice(0, 2).map((entry, index) => <article className="selected-project" key={entry.id}>
        <div className="selection-topic"><span>0{index + 1}</span><span>{entry.categories.map(category => category.name).join(" / ") || "个人作品"}</span></div>
        <Link href={"/work/" + entry.slug} prefetch={true} transitionTypes={["project-open"]} className="gallery-picture" aria-label={"查看作品：" + entry.title}>
          <TiltCover><ProjectCover entry={entry} sizes="(max-width: 760px) 88vw, 50vw"/>
            {entry.demo && <span className="gallery-demo">示例作品</span>}
            <span className="gallery-open" aria-hidden="true"><ArrowUpRight size={24} strokeWidth={1.4}/></span>
            <span className="cover-invitation" aria-hidden="true">打开项目</span>
          </TiltCover>
        </Link>
        <div className="selection-caption"><h3><Link href={"/work/" + entry.slug} prefetch={true} transitionTypes={["project-open"]}>{entry.title}</Link></h3><span>{entry.year}</span></div>
        <p>{entry.summary}</p>
      </article>) : <p className="editorial-empty">作品整理中，发布后会出现在这里。</p>}</div>
      <div className="selection-end"><Asterisk size={19} strokeWidth={1}/><span>一些完成的作品，一些仍在继续的尝试。</span></div>
    </section>

    <JournalReveal>
      <section className="home-journal" id="latest-notes" aria-labelledby="journal-title">
        <div className="journal-intro"><span className="journal-eyebrow">02 / 思考</span><h2 id="journal-title" lang="en">Thinking<br/><em>out loud.</em></h2><p>写下遇到的问题，<br/>也留下解决问题的过程。</p><Link className="editorial-link" href="/learn">进入思考 <ArrowUpRight size={18}/></Link><Asterisk className="journal-mark" size={100} strokeWidth={.6} aria-hidden="true"/></div>
        <div className="journal-entries">{notes.length ? notes.slice(0, 3).map((entry, i) => <LearningRow key={entry.id} entry={entry} index={i}/>) : <p className="editorial-empty">还没有发布的笔记。</p>}</div>
      </section>
    </JournalReveal>

    <section className="home-personal" aria-labelledby="personal-title">
      <div className="section-kicker"><span>03 / 和我</span><span>A LITTLE MORE PERSONAL</span></div>
      <Link href="/about" className="personal-link"><div><p>作品之外，还有一个不断变化的我。</p><h2 id="personal-title" lang="en">Still <em>becoming.</em></h2></div><span className="personal-arrow" aria-label="了解我"><ArrowUpRight strokeWidth={1}/></span></Link>
      <div className="personal-bottom"><div className="personal-status"><span className="personal-caption">屏幕的另一边</span><StatusPanel initial={status} demo={demo}/></div><span className="personal-signoff">谢谢你，来过我的小小宇宙。</span></div>
    </section>
  </div>;
}
