import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Xuan — work, notes and a little about me";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const serif = await readFile(join(process.cwd(), "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"));

export default function OpenGraph() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#f3f0e9", color: "#292622", display: "flex", padding: 70, flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ display: "flex", fontSize: 19, justifyContent: "space-between", color: "#6f695f" }}><span>Personal website</span><span>Work · Notes · About</span></div>
    <div style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: 310, letterSpacing: -15, lineHeight: 1 }}>Xuan<span style={{ color: "#813b32" }}>.</span></div>
    <div style={{ borderTop: "1px solid #d4cec3", display: "flex", paddingTop: 20, fontSize: 16, color: "#6f695f" }}>A collection of work and thoughts.</div>
  </div>, { ...size, fonts: [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }] });
}
