"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { boundedPitch, boundedYaw, gestureIntent, mobileArtSlot, type GestureIntent } from "@/lib/sculpture-interaction";
import { createLetterform } from "./sculpture-model";

type Props = {
  paused: boolean; reduced: boolean; expanded: boolean;
  onReady: (ready: boolean) => void; onToggle: () => void; onReset: () => void;
};

export default function Sculpture({ paused, reduced, expanded, onReady, onToggle, onReset }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const hitArea = useRef<HTMLButtonElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const options = useRef({ paused, reduced, expanded, onToggle, onReset });
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    options.current = { paused, reduced, expanded, onToggle, onReset };
    wake.current();
  }, [paused, reduced, expanded, onToggle, onReset]);
  useEffect(() => {
    const story = document.getElementById("home-story");
    if (!host.current || !hitArea.current || !caption.current || !resetButton.current || !story) return;
    const element = host.current;
    const handle = hitArea.current;
    const hint = caption.current;
    const reset = resetButton.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
    camera.position.set(0, 0, 9);
    renderer.setClearColor(0xf5f4ef, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.prepend(renderer.domElement);

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, .04);
    scene.environment = environmentMap.texture;
    environment.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777d6d, 1.5));
    const key = new THREE.DirectionalLight(0xfffdf0, 3.2);
    key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xe8ffd3, 2.8);
    rim.position.set(3, 1, -2); scene.add(rim);
    const softbox = new THREE.PointLight(0xfffbea, 26, 15, 2);
    softbox.position.set(-1.5, 2.5, 4); scene.add(softbox);

    const letterform = createLetterform();
    const sculpture = letterform.root;
    scene.add(sculpture);

    // A soft procedural shadow supplies depth without downloading image assets.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const context = shadowCanvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
      gradient.addColorStop(0, "rgba(37,43,24,.20)"); gradient.addColorStop(.5, "rgba(37,43,24,.06)"); gradient.addColorStop(1, "rgba(37,43,24,0)");
      context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.position.z = -1; scene.add(shadow);

    const sections = [...story.querySelectorAll<HTMLElement>(".story-section")];
    let width = 1, height = 1, mobile = false, progress = 0, smoothProgress = 0;
    let inView = true, contextLost = false, disposed = false, frame = 0, lastTime = 0, isReady = false;
    let elapsed = 0, mouseX = 0, mouseY = 0, easedX = 0, easedY = 0, dirty = true;
    let yaw = 0, pitch = 0, easedYaw = 0, easedPitch = 0, velocity = 0, open = 0;
    let returnAt = 0;
    let metrics: { top: number; copyBottom: number; artBottom?: number }[] = [];
    let drag: { id: number; x: number; y: number; yaw: number; pitch: number; lastX: number; intent: GestureIntent; type: string } | null = null;
    let suppressClick = false;
    const measure = () => {
      const storyTop = story.getBoundingClientRect().top;
      metrics = sections.map(section => {
        const rect = section.getBoundingClientRect();
        const copy = section.querySelector(".hero-identity, .chapter-copy, .gallery-heading")?.getBoundingClientRect();
        const description = section.querySelector(".hero-description")?.getBoundingClientRect();
        return { top: rect.top - storyTop, copyBottom: copy ? copy.bottom - rect.top : 0, artBottom: description ? description.top - rect.top - 50 : undefined };
      });
    };
    const resize = () => {
      width = element.clientWidth; height = element.clientHeight;
      if (!width || !height) return;
      mobile = width <= 760;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height, false); measure(); dirty = true;
    };
    const scroll = () => {
      const box = story.getBoundingClientRect();
      const y = -box.top;
      const next = metrics.findIndex(item => item.top > y);
      if (next < 0) progress = 2;
      else if (next === 0) progress = 0;
      else progress = next - 1 + (y - metrics[next - 1].top) / (metrics[next].top - metrics[next - 1].top);
      inView = box.bottom > 0 && box.top < window.innerHeight;
      dirty = true; schedule();
    };
    const pointer = (event: PointerEvent) => {
      if (drag && drag.id === event.pointerId) {
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (drag.intent === "pending") drag.intent = gestureIntent(dx, dy, drag.type);
        if (drag.intent !== "pending") suppressClick = true;
        if (drag.intent !== "rotate") return;
        const speed = mobile ? .012 : .008;
        yaw = boundedYaw(drag.yaw + dx * speed);
        pitch = boundedPitch(drag.pitch + (drag.type === "mouse" ? dy * .005 : 0));
        velocity = THREE.MathUtils.clamp((event.clientX - drag.lastX) * speed, -.065, .065);
        drag.lastX = event.clientX;
        handle.dataset.dragging = "true";
        dirty = true; schedule(); return;
      }
      if (event.pointerType !== "mouse" || options.current.paused || options.current.reduced) return;
      const bounds = handle.getBoundingClientRect();
      mouseX = (event.clientX - bounds.left) / bounds.width - .5;
      mouseY = (event.clientY - bounds.top) / bounds.height - .5;
      dirty = true; schedule();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      suppressClick = false; velocity = 0;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, lastX: event.clientX, intent: "pending", type: event.pointerType };
      handle.setPointerCapture(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      // A cancelled/vertical gesture must never turn into the object's click action.
      if (event.type === "pointercancel" || drag.intent === "scroll") { suppressClick = true; velocity = 0; }
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      returnAt = performance.now() + 1600;
      drag = null; handle.dataset.dragging = "false"; dirty = true; schedule();
    };
    const click = (event: MouseEvent) => {
      if (event.detail > 0 && suppressClick) { suppressClick = false; return; }
      options.current.onToggle();
    };
    const restore = () => {
      yaw = pitch = velocity = mouseX = mouseY = 0;
      returnAt = 0;
      if (document.activeElement === reset) handle.focus({ preventScroll: true });
      options.current.onReset(); dirty = true; schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape'].includes(event.key)) return;
      event.preventDefault(); velocity = 0;
      returnAt = 0;
      if (event.key === "ArrowLeft") yaw = boundedYaw(yaw - .18);
      if (event.key === "ArrowRight") yaw = boundedYaw(yaw + .18);
      if (event.key === "ArrowUp") pitch = boundedPitch(pitch - .12);
      if (event.key === "ArrowDown") pitch = boundedPitch(pitch + .12);
      if (event.key === "Home" || event.key === "Escape") restore();
      dirty = true; schedule();
    };
    const leave = () => { mouseX = mouseY = 0; dirty = true; schedule(); };
    const cancelDrag = () => {
      if (drag && handle.hasPointerCapture(drag.id)) handle.releasePointerCapture(drag.id);
      drag = null; velocity = 0; handle.dataset.dragging = "false"; leave();
    };
    const visibility = () => { if (document.hidden) { cancelDrag(); cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; dirty = true; schedule(); } };
    function schedule() { if (!disposed && !frame && !document.hidden && inView && !contextLost) frame = requestAnimationFrame(render); }
    wake.current = () => { dirty = true; schedule(); };
    function render(time: number) {
      frame = 0;
      if (disposed || document.hidden || !inView || contextLost) return;
      const still = options.current.paused || options.current.reduced;
      const interacting = !!drag || Math.abs(velocity) > .001;
      if (time - lastTime < (interacting ? 14 : 30) && !dirty) { schedule(); return; }
      const delta = Math.min((time - (lastTime || time - 16)) / 1000, .05); lastTime = time;
      const blend = options.current.reduced ? 1 : 1 - Math.exp(-delta * 12);
      if (!still) elapsed += delta;
      if (!drag && !still && Math.abs(velocity) > .0001) { yaw = boundedYaw(yaw + velocity * delta * 24); velocity *= Math.exp(-delta * 9); }
      else if (still) velocity = 0;
      if (!drag && !still && returnAt && time > returnAt) {
        yaw *= Math.exp(-delta * 3); pitch *= Math.exp(-delta * 3);
        if (Math.abs(yaw) + Math.abs(pitch) < .002) { yaw = pitch = returnAt = 0; }
      }
      smoothProgress += (progress - smoothProgress) * blend;
      easedX += ((still ? 0 : mouseX) - easedX) * blend;
      easedY += ((still ? 0 : mouseY) - easedY) * blend;
      easedYaw += (yaw - easedYaw) * blend; easedPitch += (pitch - easedPitch) * blend;
      open += ((options.current.expanded ? 1 : 0) - open) * blend;
      const p = smoothProgress;
      const visibility = 1 - THREE.MathUtils.smoothstep(p, .12, .72);
      element.style.opacity = String(visibility);
      element.inert = progress > .2;
      const chapter = Math.min(Math.floor(p), 1);
      // A held pose at either end gives reading time; the middle is the transition.
      const t = THREE.MathUtils.smootherstep(p - chapter, .12, .88);
      const mix = chapter === 0 ? t : 1 - t;
      const worldHeight = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18));
      const worldWidth = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18)) * camera.aspect;
      const slots = metrics.map(item => mobileArtSlot(width, height, item.copyBottom, item.artBottom));
      const slotA = slots[chapter] || { x: width / 2, y: height * .7, size: 220 };
      const slotB = slots[chapter + 1] || slotA;
      const x = mobile ? width / 2 : THREE.MathUtils.lerp(.56, .5, mix) * width;
      const y = mobile ? THREE.MathUtils.lerp(slotA.y, slotB.y, t) : height * .34;
      const size = mobile ? THREE.MathUtils.lerp(slotA.size, slotB.size, t) : THREE.MathUtils.lerp(Math.min(width * .55, height * .51, 730), Math.min(width * .7, height * .8, 900), mix);
      sculpture.position.set((x / width - .5) * worldWidth, (.5 - y / height) * worldHeight + (still ? 0 : Math.sin(elapsed * .65) * .025), 0);
      const angles = [-.42, 1.4, 1.4];
      const baseYaw = THREE.MathUtils.lerp(angles[chapter], angles[chapter + 1], t);
      const roll = THREE.MathUtils.lerp([-.12, .14, -.04][chapter], [-.12, .14, -.04][chapter + 1], t);
      sculpture.rotation.set(.16 + easedPitch + easedY * .09, baseYaw + easedYaw + easedX * .13, roll);
      sculpture.scale.setScalar(size / height * worldHeight / 4.8 * (1 - mix * .06 - open * .12));
      // The opening scroll reveals the layers before the object leaves the gallery clear.
      letterform.pose(Math.min(1.5, mix * 2 + open), Math.min(1.8, mix * 2 + open * .9), mix * .25 + open * .08);
      shadow.position.set(sculpture.position.x, sculpture.position.y - sculpture.scale.x * 2.05, -1);
      shadow.scale.set(sculpture.scale.x * 4.2, sculpture.scale.x * .38, 1);
      shadowMaterial.opacity = 1 - mix * .85;
      handle.style.width = `${size}px`; handle.style.height = `${size}px`;
      handle.style.transform = `translate3d(${x - size / 2}px,${y - size / 2}px,0)`;
      hint.style.transform = `translate3d(${x}px,${y + size / 2 + 20}px,0) translateX(-50%)`;
      hint.dataset.changed = String(Math.abs(yaw) + Math.abs(pitch) > .01 || options.current.expanded);
      element.dataset.compact = String(size < 130);
      if (visibility > 0 || dirty) renderer.render(scene, camera);
      if (!isReady) { isReady = true; onReady(true); }
      dirty = false;
      const settling = Math.abs(progress - p) + Math.abs(yaw - easedYaw) + Math.abs(pitch - easedPitch) + Math.abs((options.current.expanded ? 1 : 0) - open) + Math.abs((still ? 0 : mouseX) - easedX) > .001;
      if ((!still && visibility > 0) || interacting || settling) schedule();
    }
    const observer = new ResizeObserver(() => { resize(); scroll(); });
    observer.observe(element);
    sections.forEach(section => {
      observer.observe(section);
      section.querySelectorAll(".hero-identity, .hero-description, .chapter-copy, .gallery-heading").forEach(copy => observer.observe(copy));
    });
    window.addEventListener("scroll", scroll, { passive: true });
    handle.addEventListener("pointerdown", down); handle.addEventListener("pointermove", pointer);
    handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
    handle.addEventListener("lostpointercapture", up);
    handle.addEventListener("click", click); handle.addEventListener("keydown", keyboard);
    handle.addEventListener("pointerleave", leave);
    reset.addEventListener("click", restore);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", cancelDrag);
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; isReady = false; onReady(false); cancelAnimationFrame(frame); frame = 0; };
    const restored = () => { contextLost = false; dirty = true; schedule(); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", restored);
    resize(); scroll();
    smoothProgress = progress;
    return () => {
      disposed = true; wake.current = () => {}; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", scroll);
      handle.removeEventListener("pointerdown", down); handle.removeEventListener("pointermove", pointer);
      handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up);
      handle.removeEventListener("lostpointercapture", up);
      handle.removeEventListener("click", click); handle.removeEventListener("keydown", keyboard);
      handle.removeEventListener("pointerleave", leave);
      reset.removeEventListener("click", restore);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", cancelDrag);
      renderer.domElement.removeEventListener("webglcontextlost", lost); renderer.domElement.removeEventListener("webglcontextrestored", restored);
      letterform.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose(); environmentMap.dispose();
      renderer.dispose(); renderer.domElement.remove(); onReady(false);
    };
  }, [onReady]);
  return <div className="sculpture-canvas" ref={host}>
    <button ref={hitArea} type="button" className="sculpture-handle" aria-label={expanded ? "合拢 X 雕塑" : "展开 X 雕塑"} aria-pressed={expanded} aria-describedby="sculpture-instructions"/>
    <div className="sculpture-hint" ref={caption}><span aria-hidden="true">拖动探索 <i/> {expanded ? "点击合拢" : "点击拆解"}</span><button type="button" ref={resetButton}>复位</button></div>
    <p className="sr-only" id="sculpture-instructions">拖动旋转，点击展开或合拢。键盘方向键旋转，Enter 或空格展开，Home 或 Escape 复位。手机上纵向滑动仍可滚动页面。</p>
  </div>;
}
