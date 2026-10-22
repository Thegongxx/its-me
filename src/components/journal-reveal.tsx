"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "motion/react";
import { useRef, type ReactNode } from "react";

export function JournalReveal({ children }: { children: ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "start 25%"] });
  const inset = useTransform(scrollYProgress, [0, 1], [4, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 0]);
  return <motion.div ref={section} className="journal-sheet" style={{ "--sheet-inset": reduce ? 0 : inset, "--sheet-radius": reduce ? 0 : radius } as MotionStyle}>{children}</motion.div>;
}
