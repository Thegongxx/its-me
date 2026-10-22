"use client";

import { useRef } from "react";
import { useReducedMotion } from "motion/react";

/** The contents remain server rendered links. Only the surface responds to a mouse. */
export function TiltSurface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const neutral = () => {
    surface.current?.style.setProperty("--tilt-x", "0deg");
    surface.current?.style.setProperty("--tilt-y", "0deg");
  };
  return <div ref={surface} className={`tilt-surface ${className}`} onPointerMove={event => {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", `${(event.clientY - rect.top - rect.height / 2) / rect.height * -5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(event.clientX - rect.left - rect.width / 2) / rect.width * 7}deg`);
  }} onPointerLeave={neutral} onBlur={neutral}>{children}</div>;
}
