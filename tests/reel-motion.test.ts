import { describe, expect, it } from "vitest";
import { getReelFrame, type ReelGeometry } from "@/lib/reel-motion";

const desktop: ReelGeometry = { width: 1440, height: 1000, top: 110, slots: [
  { x: 86, y: 2060, width: 644, height: 460 },
  { x: 820, y: 2185, width: 532, height: 380 },
] };

describe("cover choreography", () => {
  it("lands exactly in the real cards even after a fast anchor jump outruns the spring", () => {
    const frame = getReelFrame(desktop, 6000, 250);
    expect(frame.progress).toBe(1);
    for (const cover of frame.covers) {
      expect(cover).toMatchObject({ x: 0, y: 0, scale: 1, opacity: 1 });
      expect(cover.rotateY).toBeCloseTo(0);
      expect(cover.rotateZ).toBeCloseTo(0);
    }
    expect(frame.workReveal).toBe(1);
    expect(frame.introOpacity).toBe(0);
  });
  it("restores the opening immediately when returning to the top", () => {
    expect(getReelFrame(desktop, 0, 6000)).toEqual(getReelFrame(desktop, 0, 0));
  });
  it("keeps the featured cover visible and all geometry finite on narrow, tall and short viewports", () => {
    for (const [width, height] of [[320, 667], [390, 844], [834, 1112], [1440, 720]]) {
      const geometry = { ...desktop, width, height };
      for (let y = 0; y < 4000; y += 20) {
        const frame = getReelFrame(geometry, y, y - 50);
        expect(frame.covers[0].opacity).toBe(1);
        for (const cover of frame.covers) {
          expect(Object.values(cover).every(Number.isFinite)).toBe(true);
          expect(cover.scale).toBeGreaterThan(0);
          expect(cover.opacity).toBeGreaterThanOrEqual(0);
          expect(cover.opacity).toBeLessThanOrEqual(1);
        }
      }
    }
  });
  it("is reversible at every sampled position and tolerates zero published projects", () => {
    const positions = [0, 120, 500, 900, 1500, 2300];
    const forward = positions.map(y => getReelFrame(desktop, y, y));
    expect(positions.toReversed().map(y => getReelFrame(desktop, y, y)).toReversed()).toEqual(forward);
    expect(getReelFrame({ ...desktop, slots: [] }, 0, 0).covers).toEqual([]);
  });
});
