"use client";

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { boundedPitch, gestureIntent, mobileArtSlot, type GestureIntent } from "@/lib/sculpture-interaction";

// The form is generated here: two bent, interwoven strokes of X. No external model or texture.
function makeStroke() {
  const lengthSegments = 96, radialSegments = 32;
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments, y = (t - .5) * 4.25, twist = y * .8;
    const tip = .86 + .14 * Math.sin(Math.PI * t);
    for (let j = 0; j <= radialSegments; j++) {
      const a = j / radialSegments * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      // A rounded rectangular cross section, swept continuously along the curved stroke.
      const x = .55 * Math.sign(c) * Math.abs(c) ** .32 * tip;
      const z = .085 * Math.sign(s) * Math.abs(s) ** .32;
      vertices.push(x * Math.cos(twist) - z * Math.sin(twist) + .32 * Math.sin(y * 1.4), y,
        x * Math.sin(twist) + z * Math.cos(twist) + .42 * Math.cos(y * 1.2));
      if (i < lengthSegments && j < radialSegments) {
        const a = i * (radialSegments + 1) + j, b = a + radialSegments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  for (const end of [0, lengthSegments]) {
    const y = (end / lengthSegments - .5) * 4.25, center = vertices.length / 3;
    vertices.push(.32 * Math.sin(y * 1.4), y, .42 * Math.cos(y * 1.2));
    for (let j = 0; j < radialSegments; j++) {
      const v = end * (radialSegments + 1) + j;
      indices.push(center, end === 0 ? v : v + 1, end === 0 ? v + 1 : v);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

type Props = {
  paused: boolean; reduced: boolean; expanded: boolean;
  onReady: (ready: boolean) => void; onToggle: () => void; onReset: () => void;
};

export default function Sculpture({ paused, reduced, expanded, onReady, onToggle, onReset }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const hitArea = useRef<HTMLButtonElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const options = useRef({ paused, reduced, expanded, onToggle, onReset });
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    options.current = { paused, reduced, expanded, onToggle, onReset };
    wake.current();
  }, [paused, reduced, expanded, onToggle, onReset]);
  useEffect(() => {
    const story = document.getElementById("home-story");
    if (!host.current || !hitArea.current || !toolbar.current || !resetButton.current || !story) return;
    const element = host.current;
    const handle = hitArea.current;
    const tools = toolbar.current;
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
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.prepend(renderer.domElement);

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, .04);
    scene.environment = environmentMap.texture;
    environment.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b8ab, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xf0ffd2, 2);
    rim.position.set(3, 1, -2); scene.add(rim);

    const sculpture = new THREE.Group();
    const geometry = makeStroke();
    const graphite = new THREE.MeshPhysicalMaterial({ color: 0x252a21, metalness: .42, roughness: .32, clearcoat: .5, clearcoatRoughness: .28 });
    const lime = new THREE.MeshPhysicalMaterial({ color: 0xa7d532, metalness: .12, roughness: .34, clearcoat: .4, clearcoatRoughness: .3 });
    const first = new THREE.Mesh(geometry, graphite);
    const second = new THREE.Mesh(geometry, lime);
    first.rotation.z = -.63; first.position.z = .23;
    second.rotation.z = .63; second.position.z = -.23;
    sculpture.add(first, second); scene.add(sculpture);

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
    let yaw = 0, pitch = 0, easedYaw = 0, easedPitch = 0, velocity = 0, open = 0, hover = 0;
    let metrics: { top: number; copyBottom: number }[] = [];
    let drag: { id: number; x: number; y: number; yaw: number; pitch: number; lastX: number; intent: GestureIntent; type: string } | null = null;
    let suppressClick = false;
    const measure = () => {
      const storyTop = story.getBoundingClientRect().top;
      metrics = sections.map(section => {
        const rect = section.getBoundingClientRect();
        const copy = section.querySelector(".hero-copy, .chapter-copy")!.getBoundingClientRect();
        return { top: rect.top - storyTop, copyBottom: copy.bottom - rect.top };
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
        yaw = drag.yaw + dx * speed;
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
      hover = 1; dirty = true; schedule();
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
      drag = null; handle.dataset.dragging = "false"; dirty = true; schedule();
    };
    const click = (event: MouseEvent) => {
      if (event.detail > 0 && suppressClick) { suppressClick = false; return; }
      options.current.onToggle();
    };
    const restore = () => {
      yaw = pitch = velocity = mouseX = mouseY = 0;
      options.current.onReset(); dirty = true; schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape'].includes(event.key)) return;
      event.preventDefault(); velocity = 0;
      if (event.key === "ArrowLeft") yaw -= .22;
      if (event.key === "ArrowRight") yaw += .22;
      if (event.key === "ArrowUp") pitch = boundedPitch(pitch - .12);
      if (event.key === "ArrowDown") pitch = boundedPitch(pitch + .12);
      if (event.key === "Home" || event.key === "Escape") restore();
      dirty = true; schedule();
    };
    const leave = () => { mouseX = mouseY = hover = 0; dirty = true; schedule(); };
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
      if (!drag && !still && Math.abs(velocity) > .0001) { yaw += velocity * delta * 45; velocity *= Math.exp(-delta * 7); }
      else if (still) velocity = 0;
      smoothProgress += (progress - smoothProgress) * blend;
      easedX += ((still ? 0 : mouseX) - easedX) * blend;
      easedY += ((still ? 0 : mouseY) - easedY) * blend;
      easedYaw += (yaw - easedYaw) * blend; easedPitch += (pitch - easedPitch) * blend;
      open += ((options.current.expanded ? 1 : 0) - open) * blend;
      const p = smoothProgress;
      const chapter = Math.min(Math.floor(p), 1);
      const t = THREE.MathUtils.smoothstep(p - chapter, 0, 1);
      const mix = chapter === 0 ? t : 1 - t;
      const separation = open * .38;
      const worldHeight = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18));
      const worldWidth = 2 * 9 * Math.tan(THREE.MathUtils.degToRad(18)) * camera.aspect;
      const slots = metrics.map(item => mobileArtSlot(width, height, item.copyBottom));
      const slotA = slots[chapter] || { x: width / 2, y: height * .7, size: 220 };
      const slotB = slots[chapter + 1] || slotA;
      const x = mobile ? width / 2 : THREE.MathUtils.lerp(width * .735, width * .26, mix);
      const y = mobile ? THREE.MathUtils.lerp(slotA.y, slotB.y, t) : height * .49;
      const size = mobile ? THREE.MathUtils.lerp(slotA.size, slotB.size, t) : Math.min(width * .4, height * .69, 690);
      sculpture.position.set((x / width - .5) * worldWidth, (.5 - y / height) * worldHeight + (still ? 0 : Math.sin(elapsed * .65) * .025), 0);
      // Each scroll chapter keeps a readable X; the visitor controls the full rotation.
      const angles = [-.22, .38, -.38];
      const baseYaw = THREE.MathUtils.lerp(angles[chapter], angles[chapter + 1], t);
      sculpture.rotation.set(.08 + easedPitch + easedY * .1, baseYaw + easedYaw + easedX * .14, -.035);
      sculpture.scale.setScalar(size / height * worldHeight / 4.75 * (1 - open * .05));
      first.position.x = -separation; second.position.x = separation;
      first.rotation.z = -.63 - open * .16; second.rotation.z = .63 + open * .16;
      first.position.z = .23 + separation * .7; second.position.z = -.23 - separation * .7;
      graphite.clearcoat = .5 + hover * .2;
      shadow.position.set(sculpture.position.x, sculpture.position.y - sculpture.scale.x * 2.05, -1);
      shadow.scale.set(sculpture.scale.x * 4, sculpture.scale.x * .4, 1);
      handle.style.width = `${size}px`; handle.style.height = `${size}px`;
      handle.style.transform = `translate3d(${x - size / 2}px,${y - size / 2}px,0)`;
      tools.style.transform = `translate3d(${x}px,${y + size / 2 + 6}px,0) translateX(-50%)`;
      element.dataset.compact = String(size < 130);
      renderer.render(scene, camera);
      if (!isReady) { isReady = true; onReady(true); }
      dirty = false;
      const settling = Math.abs(progress - p) + Math.abs(yaw - easedYaw) + Math.abs(pitch - easedPitch) + Math.abs((options.current.expanded ? 1 : 0) - open) + Math.abs((still ? 0 : mouseX) - easedX) > .001;
      if (!still || interacting || settling) schedule();
    }
    const observer = new ResizeObserver(() => { resize(); scroll(); });
    observer.observe(element);
    sections.forEach(section => { const copy = section.querySelector(".hero-copy, .chapter-copy"); if (copy) observer.observe(copy); });
    window.addEventListener("scroll", scroll, { passive: true });
    handle.addEventListener("pointerdown", down); handle.addEventListener("pointermove", pointer);
    handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
    handle.addEventListener("lostpointercapture", up);
    handle.addEventListener("click", click); handle.addEventListener("keydown", keyboard);
    handle.addEventListener("pointerleave", leave); reset.addEventListener("click", restore);
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
      handle.removeEventListener("pointerleave", leave); reset.removeEventListener("click", restore);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", cancelDrag);
      renderer.domElement.removeEventListener("webglcontextlost", lost); renderer.domElement.removeEventListener("webglcontextrestored", restored);
      geometry.dispose(); graphite.dispose(); lime.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose(); environmentMap.dispose();
      renderer.dispose(); renderer.domElement.remove(); onReady(false);
    };
  }, [onReady]);
  return <div className="sculpture-canvas" ref={host}>
    <button ref={hitArea} type="button" className="sculpture-handle" aria-label={expanded ? "合拢 X 雕塑" : "展开 X 雕塑"} aria-pressed={expanded} aria-describedby="sculpture-instructions"/>
    <div className="sculpture-tools" ref={toolbar}>
      <span aria-hidden="true">拖动旋转 <i/> {expanded ? "点击合拢" : "点击展开"}</span>
      <button type="button" ref={resetButton} aria-label="复位 X 雕塑" title="复位"><RotateCcw size={14}/></button>
    </div>
    <p className="sr-only" id="sculpture-instructions">拖动旋转，点击展开或合拢。键盘方向键旋转，Enter 或空格展开，Home 或 Escape 复位。手机上纵向滑动仍可滚动页面。</p>
  </div>;
}
