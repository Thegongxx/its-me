import Link from "next/link";

export function NotFoundContent() {
  return <div className="page-shell error-page"><Link href="/#hello" className="wordmark">Xuan ↗</Link><span className="mono error-code">404</span><h1>没有找到这个页面</h1><p>链接可能已经更改，或内容尚未公开。</p><Link href="/#hello" className="button button-dark">回到首页 ↗</Link></div>;
}
