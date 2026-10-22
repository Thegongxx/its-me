import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import "./admin.css";
export const metadata: Metadata = { title: "管理工作台", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="admin-root"><header className="admin-header"><Link href="/#hello" className="wordmark">Xuan<span className="admin-label mono">/ STUDIO</span></Link><Link href="/#hello" className="text-link">查看网站 <ArrowUpRight size={16}/></Link></header><main id="main" tabIndex={-1}>{children}</main><footer className="admin-footer mono">Xuan / PRIVATE WORKBENCH <span>PRIVATE</span></footer></div>; }
