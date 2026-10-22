import { ImageResponse } from "next/og";
export const alt = "Xuan — personal website";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraph() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#f5f4ef", color: "#252823", display: "flex", padding: 80, alignItems: "center", justifyContent: "space-between", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 21, letterSpacing: 3 }}>PERSONAL WEBSITE</div><div style={{ display: "flex", fontSize: 158, letterSpacing: -12, lineHeight: 1.3 }}>Xuan<span style={{ color: "#9abf47" }}>.</span></div><div style={{ fontSize: 20, color: "#6d7168", marginTop: 20 }}>WORK · NOTES · ABOUT</div></div>
    <div style={{ width: 270, height: 330, display: "flex", position: "relative" }}><div style={{ position: "absolute", top: 0, left: 90, width: 65, height: 330, borderRadius: 32, background: "#c9e98b", transform: "rotate(34deg)" }}/><div style={{ position: "absolute", top: 0, left: 90, width: 65, height: 330, borderRadius: 32, background: "#30372b", transform: "rotate(-34deg)" }}/></div>
  </div>, size);
}
