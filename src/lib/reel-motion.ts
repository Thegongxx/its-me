export type ReelGeometry = {
  width: number;
  height: number;
  top: number;
  slots: { x: number; y: number; width: number; height: number }[];
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const phase = (p: number, start: number, end: number) => {
  const t = clamp((p - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/** Document-space choreography. At its endpoint the cover is the actual card. */
export function getReelFrame(g: ReelGeometry, scroll: number, easedScroll: number) {
  const mobile = g.width <= 760;
  const tablet = g.width <= 1000 && !mobile;
  const end = Math.max(1, (g.slots[0]?.y ?? g.height) - g.height * .42);
  const p = scroll <= g.top ? 0 : scroll >= g.top + end ? 1 : clamp((easedScroll - g.top) / end);
  const open = phase(p, 0, .4);
  const land = phase(p, .63, 1);
  const introOpacity = 1 - phase(p, .02, .29);
  return {
    progress: p,
    introOpacity,
    introY: -75 * (1 - introOpacity),
    workReveal: phase(p, .7, .91),
    cardReveal: phase(p, .92, 1),
    covers: g.slots.map((slot, index) => {
      const actualX = slot.x + slot.width / 2;
      const actualY = slot.y + slot.height / 2;
      const localScroll = Math.max(0, scroll - g.top);
      const available = g.height - Math.min(g.top, 110);
      if (index === 0) {
        const initialWidth = mobile ? g.width * .79 : tablet ? g.width * .61 : Math.min(g.width * .43, available * 1.01);
        const initialX = g.width * (mobile ? .48 : tablet ? .6 : .71);
        const initialY = mobile ? Math.max(420, available * .69) : available * (tablet ? .63 : .51);
        const expandedWidth = Math.min(g.width * .88, g.height * 1.15);
        const width = mix(initialWidth, expandedWidth, open);
        const stageY = localScroll + g.height * .49;
        const floatingY = Math.max(mix(initialY, stageY, open), localScroll + width / 2.8 + 24);
        return {
          x: mix(mix(initialX, g.width * .5, open), actualX, land) - actualX,
          y: mix(floatingY, actualY, land) - actualY,
          scale: mix(mix(initialWidth / slot.width, expandedWidth / slot.width, open), 1, land),
          rotateY: mobile ? 0 : -14 * (1 - open),
          rotateZ: -8 * (1 - open),
          opacity: 1,
          elevation: 1 - land,
        };
      }
      const separation = phase(p, 0, .32);
      const arrival = phase(p, .7, 1);
      const initialWidth = g.width * (mobile ? .31 : tablet ? .35 : .26);
      const initialX = g.width * (mobile ? .79 : .8);
      const initialY = mobile ? Math.max(285, available * .5) : available * (tablet ? .38 : .23);
      // Reposition only while fully transparent, then settle into its own slot.
      if (p > .5) return {
        x: 35 * (1 - arrival), y: 80 * (1 - arrival),
        scale: mix(.94, 1, arrival), rotateY: 0, rotateZ: 6 * (1 - arrival),
        opacity: arrival, elevation: 1 - arrival,
      };
      return {
        x: mix(initialX + separation * g.width * .15, actualX, arrival) - actualX,
        y: mix(initialY - separation * 120, actualY, arrival) - actualY,
        scale: mix(initialWidth / slot.width, 1, arrival),
        rotateY: -12 * (1 - arrival),
        rotateZ: 12 * (1 - arrival),
        opacity: (1 - phase(p, .08, .32)) + arrival,
        elevation: 1 - arrival,
      };
    }),
  };
}
