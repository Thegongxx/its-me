import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-sc";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site), title: { default: "Xuan — 个人作品与记录", template: "%s · Xuan" },
  description: "Xuan 的个人网站。作品、学习笔记，以及正在做的事。",
  openGraph: { title: "Xuan / 个人作品与记录", description: "作品、学习笔记，以及正在做的事。", type: "website", locale: "zh_CN", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image" },
  robots: process.env.DEMO_MODE === "true" || process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : { index: true, follow: true }
};
export const viewport: Viewport = { themeColor: "#f5f4ef", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body><a href="#main" className="skip-link">跳到主要内容</a>{children}</body></html>; }
