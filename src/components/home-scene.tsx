"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionStyle } from "motion/react";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

/** Decorative motion only: document scrolling and every content link remain native. */
export function HomeScene({ artwork, children }: { artwork: ReactNode; children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: .5 });
  const scale = useTransform(progress, [0, .65], [1, 1.18]);
  const rotate = useTransform(progress, [0, .65], [0, -18]);
  const artY = useTransform(progress, [0, .65], [0, -80]);
  const titleY = useTransform(progress, [0, .45], [0, -100]);
  const titleOpacity = useTransform(progress, [0, .08, .4], [1, 1, 0]);
  const settings = { stiffness: 80, damping: 24, mass: .7 };
  const pointerX = useSpring(0, settings);
  const pointerY = useSpring(0, settings);
  const pointerRotate = useTransform(pointerX, [-16, 16], [-3, 3]);

  useEffect(() => {
    if (reduce) { pointerX.jump(0); pointerY.jump(0); }
  }, [reduce, pointerX, pointerY]);

  const move = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    pointerX.set((event.clientX / window.innerWidth - .5) * 32);
    pointerY.set((event.clientY / window.innerHeight - .5) * 24);
  };
  const reset = () => { pointerX.set(0); pointerY.set(0); };

  return <section ref={section} className="home-scene" id="hello" aria-label="你好，我是 Xuan" onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
    <motion.div className="scene-sticky" style={{ "--scene-title-y": reduce ? 0 : titleY, "--scene-title-opacity": reduce ? 1 : titleOpacity } as MotionStyle}>
      <div className="scene-atmosphere" aria-hidden="true"><span className="scene-halo"/><span className="scene-horizon"/></div>
      <div className="scene-art-position" aria-hidden="true"><motion.div className="scene-art-scroll" style={{ scale: reduce ? 1 : scale, rotate: reduce ? 0 : rotate, y: reduce ? 0 : artY }}><motion.div className="scene-art-pointer" style={{ x: pointerX, y: pointerY, rotate: reduce ? 0 : pointerRotate }}>{artwork}</motion.div></motion.div></div>
      {children}
      <div className="scene-grain" aria-hidden="true"/>
    </motion.div>
  </section>;
}
