import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getProfile, getExperiences } from "@/lib/content";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "关于我", alternates: { canonical: "/about" } };
export default async function About() {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  return <div className="page-shell about-page">
    <header className="about-header"><div className="about-heading"><p className="about-eyebrow">关于我</p><h1>Hello,<br/>I’m <em>{profile.name}.</em></h1></div><div className="about-summary"><p>{profile.bio}</p><div className="about-meta"><span>{profile.location || "所在地待填写"}</span>{profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14}/></a>}</div></div></header>
    <div className="about-body"><h2>自我介绍</h2><Markdown body={profile.introduction}/></div>
    <section className="about-experience"><h2>经历</h2><div>
      {experiences.length ? experiences.map(e => <div className="experience-row" key={e.id}><span>{e.period}</span><div><h3>{e.title}</h3><span>{e.organization}</span><p>{e.description}</p></div></div>) : <p className="experience-placeholder">教育、工作与实践经历待填写。</p>}
    </div></section><div className="contact-strip"><h2 lang="en">Say hello.</h2>{profile.email ? <a href={`mailto:${profile.email}`} className="editorial-link">{profile.email}<ArrowUpRight size={18}/></a> : <span className="contact-placeholder">联系邮箱待填写</span>}</div>
  </div>;
}
