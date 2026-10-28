"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
const links = [{ href: "/work", label: "作品集" }, { href: "/learn", label: "思考" }, { href: "/about", label: "和我" }];
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return <header className="site-header">
    <Link href="/#hello" className="wordmark" aria-label="Xuan 首页">Xuan<span className="wordmark-dot"/></Link>
    <nav className="desktop-nav" aria-label="主导航">{links.map(l => <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>)}</nav>
    <button ref={menuButton} className="menu-toggle icon-button" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "关闭导航" : "打开导航"} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    {open && <nav id="mobile-nav" className="mobile-nav" aria-label="移动导航">{links.map(l => <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? "page" : undefined}><span>{l.label}</span><span aria-hidden="true">↗</span></Link>)}</nav>}
  </header>;
}
