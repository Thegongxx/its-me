"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import "./sculpture.css";

const Sculpture = dynamic(() => import("./sculpture"), { ssr: false });
const chapters = [{ id: "hello", label: "介绍" }, { id: "selected-work", label: "作品" }, { id: "latest-notes", label: "学习" }];

export function SceneStage() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(value => !value), []);
  const close = useCallback(() => setExpanded(false), []);
  useEffect(() => {
    const nodes = chapters.map(({ id }) => document.getElementById(id)).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setChapter(chapters.findIndex(item => item.id === entry.target.id));
    }, { rootMargin: "-40% 0px -40% 0px" });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return <div className="scene-layer" data-ready={ready}>
    <div className="scene-grid" aria-hidden="true"/>
    <div className="sculpture-fallback" aria-hidden="true"><span/><span/></div>
    <Sculpture paused={paused} reduced={!!reduced} expanded={expanded} onToggle={toggle} onReset={close} onReady={setReady}/>
    <nav className="chapter-navigation" aria-label="首页章节">{chapters.map((item, index) => <a href={`#${item.id}`} key={item.id} aria-label={item.label} aria-current={chapter === index ? "step" : undefined}><span className="mono">0{index + 1}</span><i/></a>)}</nav>
    <motion.button className="scene-motion-control" whileTap={reduced ? {} : { scale: .95 }} aria-pressed={paused || !!reduced} disabled={!!reduced} aria-label={reduced ? "已遵循系统减少动态效果设置" : paused ? "播放背景动效" : "暂停背景动效"} onClick={() => setPaused(value => !value)}>{paused || reduced ? <Play size={13}/> : <Pause size={13}/>}<span>{reduced ? "静态模式" : paused ? "播放" : "暂停"}</span></motion.button>
  </div>;
}
