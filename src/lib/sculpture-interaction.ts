export type GestureIntent = "pending" | "rotate" | "scroll";

/** Keep a vertical touch gesture with the browser, even when it starts on the sculpture. */
export function gestureIntent(dx: number, dy: number, pointerType: string): GestureIntent {
  if (Math.hypot(dx, dy) < 7) return "pending";
  if (pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx) * 1.15) return "scroll";
  return "rotate";
}

export function boundedPitch(value: number) {
  return Math.max(-.38, Math.min(.38, value));
}

/** Keep the front of the letter visible, including after a long drag. */
export function boundedYaw(value: number) {
  return Math.max(-.72, Math.min(.72, value));
}

/** Reserve the copy and footer first; the art fits the remaining mobile space. */
export function mobileArtSlot(width: number, height: number, copyBottom: number, availableBottom = height - 106) {
  const bottom = Math.min(height - 106, availableBottom);
  const top = copyBottom + 22;
  const size = Math.max(0, Math.min(width * .76, bottom - top, 310));
  return { x: width / 2, y: Math.max(top, (top + bottom) / 2), size };
}
