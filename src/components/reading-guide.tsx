"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; title: string };

/** The outline follows rendered Markdown, including formatted and repeated headings. */
export function ReadingGuide({ contentId }: { contentId: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [position, setPosition] = useState({ active: "", percent: 0 });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;
    const sections = Array.from(content.querySelectorAll<HTMLHeadingElement>("h2[id]"));
    setHeadings(sections.map(heading => ({ id: heading.id, title: heading.textContent || "章节" })));
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = content.getBoundingClientRect();
      const marker = Math.min(220, window.innerHeight * .25);
      const distance = Math.max(1, bounds.height - window.innerHeight * .5);
      const percent = Math.round(Math.min(1, Math.max(0, (marker - bounds.top) / distance)) * 100);
      let active = sections[0]?.id || "";
      for (const heading of sections) {
        if (heading.getBoundingClientRect().top <= marker + 4) active = heading.id;
      }
      // A short final section may never reach the marker before scrolling ends.
      if (sections.length && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        active = sections[sections.length - 1].id;
      }
      setPosition(previous => previous.active === active && previous.percent === percent ? previous : { active, percent });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule);
    resize.observe(content);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [contentId]);

  return <aside className="table-of-contents reading-guide" data-open={open}>
    <div className="reading-progress" role="progressbar" aria-label="文章阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={position.percent}>
      <span style={{ transform: `scaleX(${position.percent / 100})` }}/>
    </div>
    <div className="reading-guide-label"><span>文章目录</span><span aria-hidden="true">{position.percent}%</span></div>
    {headings.length > 0 && <button type="button" className="reading-guide-toggle" aria-expanded={open} aria-controls={`${contentId}-outline`} onClick={() => setOpen(!open)}><span>文章目录 <small>{headings.length} 个章节</small></span><span>{open ? "收起 −" : "展开 +"}</span></button>}
    {headings.length > 0 && <nav id={`${contentId}-outline`} aria-label="文章目录">{headings.map(heading =>
      <a key={heading.id} href={`#${heading.id}`} aria-current={position.active === heading.id ? "location" : undefined}>{heading.title}</a>
    )}</nav>}
    <a className="reading-return" href="#main">回到开头 <span aria-hidden="true">↑</span></a>
  </aside>;
}
