"use client";

import { motion, useReducedMotion, useScroll, type MotionStyle } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/** Native scrolling opens the covers. Content and links are rendered by the server. */
export function CoverReel({ children }: { children: ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  useEffect(() => {
    const links = section.current?.querySelectorAll<HTMLElement>(".reel-introduction a, .reel-cover-1 a, .reel-foot a");
    const desktop = window.matchMedia("(min-width: 761px)");
    // Faded cover links must not become invisible keyboard stops.
    const update = () => links?.forEach(link => {
      link.inert = desktop.matches && !reducedMotion && scrollYProgress.get() > .45;
    });
    const unsubscribe = scrollYProgress.on("change", update);
    desktop.addEventListener("change", update);
    update();
    return () => {
      unsubscribe();
      desktop.removeEventListener("change", update);
      links?.forEach(link => { link.inert = false; });
    };
  }, [reducedMotion, scrollYProgress]);
  return <motion.div ref={section} className="cover-reel" id="hello"
    style={{ "--reel-progress": reducedMotion ? 0 : scrollYProgress } as MotionStyle}>
    <div className="reel-sticky">{children}</div>
  </motion.div>;
}
