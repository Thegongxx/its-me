"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

export function TiltCover({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const bounds = useRef<DOMRect | null>(null);
  const settings = { stiffness: 240, damping: 27, mass: .45 };
  const rotateX = useSpring(0, settings);
  const rotateY = useSpring(0, settings);
  const lightX = useSpring(0, settings);
  const lightOpacity = useSpring(0, settings);
  const reset = () => { rotateX.set(0); rotateY.set(0); lightX.set(0); lightOpacity.set(0); bounds.current = null; };

  useEffect(() => {
    if (reduce) { rotateX.jump(0); rotateY.jump(0); lightX.jump(0); lightOpacity.jump(0); }
  }, [reduce, rotateX, rotateY, lightX, lightOpacity]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = bounds.current ?? event.currentTarget.getBoundingClientRect();
    bounds.current = rect;
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    rotateX.set(-y * 7); rotateY.set(x * 7);
    lightX.set(x * 60); lightOpacity.set(.22);
  };

  return <motion.div className="tilt-cover" style={{ rotateX, rotateY }} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
    {children}
    <motion.span className="cover-light" aria-hidden="true" style={{ x: lightX, opacity: lightOpacity }}/>
  </motion.div>;
}
