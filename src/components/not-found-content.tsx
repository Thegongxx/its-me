import Link from "next/link";

export function NotFoundContent() {
  return <div className="page-shell error-page"><Link href="/#hello" className="wordmark">Xuan ↗</Link><span className="mono error-code">404 / UNWRITTEN PAGE</span><h1>这页，还没写到<span className="accent-period">.</span></h1><p>链接可能已经更改，或这份档案尚未公开。</p><Link href="/#hello" className="button button-dark">回到首页 ↗</Link></div>;
}
