export type GestureIntent = "pending" | "rotate" | "scroll";

/** Keep a vertical touch gesture with the browser, even when it starts on the sculpture. */
export function gestureIntent(dx: number, dy: number, pointerType: string): GestureIntent {
  if (Math.hypot(dx, dy) < 7) return "pending";
  if (pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx) * 1.15) return "scroll";
  return "rotate";
}

export function boundedPitch(value: number) {
  return Math.max(-.6, Math.min(.6, value));
}

/** Reserve the copy and footer first; the art fits the remaining mobile space. */
export function mobileArtSlot(width: number, height: number, copyBottom: number) {
  const bottom = height - 106;
  const top = copyBottom + 22;
  const size = Math.max(0, Math.min(width * .76, bottom - top, 310));
  return { x: width / 2, y: Math.max(top, (top + bottom) / 2), size };
}
