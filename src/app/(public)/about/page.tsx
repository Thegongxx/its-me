import type { Metadata } from "next";
import { ArrowUpRight, MapPin } from "lucide-react";
import { getProfile, getExperiences } from "@/lib/content";
import { Markdown } from "@/components/markdown";
import { SectionTitle } from "@/components/ui";
import { XMark } from "@/components/x-mark";

export const metadata: Metadata = { title: "关于我", alternates: { canonical: "/about" } };
export default async function About() {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  return <div className="page-shell about-page">
    <header className="about-header"><div className="about-heading"><span className="mono about-eyebrow">03 / THE PERSON BEHIND THE WORK</span><h1>{profile.name}<span>.</span></h1><p>{profile.bio}</p><div className="about-meta"><span><MapPin size={14}/>{profile.location || "所在地待填写"}</span>{profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14}/></a>}</div></div><div className="about-monogram" aria-hidden="true"><XMark/></div></header>
    <div className="about-body"><div><span className="mono section-index">A LITTLE ABOUT ME</span><h2>认识一下。</h2></div><Markdown body={profile.introduction}/></div>
    <section className="section-space"><SectionTitle number="↳" en="EXPERIENCE" title="经历"/>
      {experiences.length ? experiences.map(e => <div className="experience-row" key={e.id}><span className="mono">{e.period}</span><div><h3>{e.title}</h3><span>{e.organization}</span><p>{e.description}</p></div></div>) : <div className="experience-placeholder">经历待填写。<span>教育、工作与实践经历将在完善资料后展示。</span></div>}
    </section><div className="contact-strip"><h2>保持联系。</h2>{profile.email ? <a href={`mailto:${profile.email}`} className="text-link">{profile.email}<ArrowUpRight size={18}/></a> : <span className="contact-placeholder">联系邮箱待填写</span>}</div>
  </div>;
}
