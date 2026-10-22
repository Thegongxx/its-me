import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { isDemo } from "@/lib/content";

export const dynamic = "force-dynamic";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-site"><Navigation/>
    {isDemo() && <div className="demo-banner"><span>预览</span>作品与学习记录为示例，个人经历待填写。</div>}
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><Link href="/#hello" className="footer-brand">Xuan<span>© 2026</span></Link><span>作品 · 学习 · 生活</span><div><Link href="/about">关于我 ↗</Link><Link href="/admin">管理</Link></div></footer>
  </div>;
}
