import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { isDemo } from "@/lib/content";
import "./portfolio.css";

export const dynamic = "force-dynamic";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-site"><Navigation/>
    {isDemo() && <div className="demo-banner">预览版 · 项目与笔记为示例内容</div>}
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><Link href="/#hello" className="footer-brand">Xuan<span>© 2026</span></Link><span>一个持续更新的个人网站</span><div><a href="#main">回到顶部 ↑</a><Link href="/admin">管理</Link></div></footer>
  </div>;
}
