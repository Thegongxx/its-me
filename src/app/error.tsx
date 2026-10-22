"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="page-shell error-page" id="main"><span className="mono">CONNECTION INTERRUPTED</span><h1>这一页，<br/>暂时没能打开<span className="accent-period">.</span></h1><p>内容服务暂时无法连接。请稍后重试，或返回首页。</p><div className="hero-actions"><button className="button button-dark" onClick={reset}>重新加载 ↗</button><Link href="/#hello" className="text-link">返回首页</Link></div></div>; }
