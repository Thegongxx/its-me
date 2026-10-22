"use client";

import { useScroll, useSpring } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { getReelFrame, type ReelGeometry } from "@/lib/reel-motion";

/** Covers remain in their articles; only their visual position changes. */
export function CoverReel({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const easedY = useSpring(scrollY, { stiffness: 240, damping: 34, mass: .45 });

  useLayoutEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const covers = [...section.querySelectorAll<HTMLElement>("[data-reel-cover]")];
    const slots = [...section.querySelectorAll<HTMLElement>("[data-cover-slot]")];
    const intro = section.querySelector<HTMLElement>(".reel-introduction");
    const foot = section.querySelector<HTMLElement>(".reel-foot");
    const workHeading = section.querySelector<HTMLElement>(".editorial-heading");
    const captions = [...section.querySelectorAll<HTMLElement>(".selection-topic, .selection-caption, .selected-project > p")];
    let geometry: ReelGeometry | undefined;
    let resizeFrame = 0;
    let lastBoundary: number | undefined;
    const draw = () => {
      if (!geometry || reduce.matches) return;
      const frame = getReelFrame(geometry, window.scrollY, easedY.get());
      const boundary = frame.progress === 0 || frame.progress === 1 ? frame.progress : undefined;
      if (boundary !== undefined && boundary === lastBoundary) return;
      lastBoundary = boundary;
      section.style.setProperty("--intro-opacity", String(frame.introOpacity));
      section.style.setProperty("--intro-y", frame.introY + "px");
      section.style.setProperty("--reel-progress", String(frame.progress));
      section.style.setProperty("--work-reveal", String(frame.workReveal));
      section.style.setProperty("--card-reveal", String(frame.cardReveal));
      if (intro) intro.inert = frame.introOpacity < .08;
      if (foot) foot.inert = frame.introOpacity < .08;
      if (workHeading) workHeading.inert = frame.workReveal < .08;
      captions.forEach(caption => { caption.inert = frame.cardReveal < .08; });
      covers.forEach((cover, index) => {
        const value = frame.covers[index];
        if (!value) return;
        cover.style.transform = "translate3d(" + value.x + "px," + value.y + "px,0) rotateY(" + value.rotateY + "deg) rotateZ(" + value.rotateZ + "deg) scale(" + value.scale + ")";
        cover.style.opacity = String(value.opacity);
        cover.style.setProperty("--cover-elevation", String(value.elevation));
        cover.inert = value.opacity < .08;
      });
    };
    const measure = () => {
      if (reduce.matches || !covers.length) {
        geometry = undefined;
        delete section.dataset.reelReady;
        section.removeAttribute("style");
        covers.forEach(cover => { cover.removeAttribute("style"); cover.inert = false; });
        if (intro) intro.inert = false;
        if (foot) foot.inert = false;
        if (workHeading) workHeading.inert = false;
        captions.forEach(caption => { caption.inert = false; });
        return;
      }
      section.dataset.reelReady = "true";
      lastBoundary = undefined;
      const rect = section.getBoundingClientRect();
      geometry = {
        width: rect.width,
        height: window.innerHeight,
        top: rect.top + window.scrollY,
        slots: slots.map(slot => {
          const box = slot.getBoundingClientRect();
          return { x: box.left - rect.left, y: box.top - rect.top, width: box.width, height: box.height };
        }),
      };
      easedY.jump(window.scrollY);
      draw();
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(section);
    slots.forEach(slot => observer.observe(slot));
    reduce.addEventListener("change", measure);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("pageshow", measure);
    const stopPhase = easedY.on("change", draw);
    const stopScroll = scrollY.on("change", draw);
    measure();
    return () => {
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      stopPhase(); stopScroll();
      reduce.removeEventListener("change", measure);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("pageshow", measure);
      covers.forEach(cover => { cover.inert = false; });
      if (intro) intro.inert = false;
      if (foot) foot.inert = false;
      if (workHeading) workHeading.inert = false;
      captions.forEach(caption => { caption.inert = false; });
    };
  }, [scrollY, easedY]);

  return <div ref={root} className="cover-reel" id="hello">{children}</div>;
}
