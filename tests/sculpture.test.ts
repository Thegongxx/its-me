import { describe, expect, it } from "vitest";
import { boundedPitch, boundedYaw, gestureIntent, mobileArtSlot } from "../src/lib/sculpture-interaction";

describe("sculpture input preserves reading and navigation", () => {
  it("does not classify tap jitter as a drag", () => {
    expect(gestureIntent(3, 2, "touch")).toBe("pending");
    expect(gestureIntent(0, 6, "mouse")).toBe("pending");
  });
  it("lets vertical touch scrolling win and accepts horizontal rotation", () => {
    expect(gestureIntent(8, 40, "touch")).toBe("scroll");
    expect(gestureIntent(40, 8, "touch")).toBe("rotate");
    expect(gestureIntent(0, 40, "mouse")).toBe("rotate");
  });
  it("bounds tilt so a long drag cannot overturn the object", () => {
    expect(boundedPitch(100)).toBe(.38);
    expect(boundedPitch(-100)).toBe(-.38);
    expect(boundedYaw(100)).toBe(.72);
    expect(boundedYaw(-100)).toBe(-.72);
  });
  it.each([[390,844,500], [360,740,480], [320,667,540], [768,1024,500]])("fits art after copy and before controls at %sx%s", (w, h, bottom) => {
    const slot = mobileArtSlot(w, h, bottom);
    expect(slot.y - slot.size / 2).toBeGreaterThanOrEqual(bottom + 22);
    if (slot.size > 0) expect(slot.y + slot.size / 2).toBeLessThanOrEqual(h - 106);
    expect(slot.size).toBeLessThanOrEqual(w * .76);
  });
  it("reserves the separate introduction below the mobile cover", () => {
    const slot = mobileArtSlot(390, 844, 272, 515);
    expect(slot.y - slot.size / 2).toBeGreaterThanOrEqual(294);
    expect(slot.y + slot.size / 2).toBeLessThanOrEqual(515);
    expect(mobileArtSlot(320, 667, 550, 530).size).toBe(0);
  });
});
