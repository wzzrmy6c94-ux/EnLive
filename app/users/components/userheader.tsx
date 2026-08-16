"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import EnliveLogo from "@/app/assets/enlive-logo-dark.png";

type Session = { id: string; name: string; role: string } | null;
const explore = ["Leaderboard", "Artists", "Venues", "Cities"];

export function UserHeader({ title, subtitle, headerMode = "private" }: { title: string; subtitle?: string; headerMode?: "public" | "private"; hideHeroHeader?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { user: Session }) => { if (!cancelled) setSession(data.user); })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeMenu = () => { setMenuOpen(false); requestAnimationFrame(() => menuButton.current?.focus()); };
  const isActive = pathname === "/leaderboard";

  return <>
    <header className="enlive-header">
      <Link href="/leaderboard" aria-label="EnLive leaderboard" className="shrink-0">
        <Image src={EnliveLogo} alt="EnLive" height={60} width={180} className="block h-auto w-28 object-contain sm:w-32" priority />
      </Link>
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/leaderboard" className={`enlive-header-link ${isActive ? "enlive-header-link-active" : ""}`}>Leaderboard</Link>
        <Link href="/pricing" className="enlive-header-link">Plans</Link>
        {headerMode === "public" && !session ? <Link href="/users/auth/login" className="enlive-header-link">Login</Link> : null}
      </div>
      <div className="flex items-center gap-2">
        {session ? <Link href={`/target/${session.id}`} className="hidden max-w-40 truncate text-xs font-medium text-[var(--text-secondary)] sm:block">{session.name}</Link> : null}
        <button ref={menuButton} type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="enlive-navigation" aria-label="Open navigation menu" className="enlive-menu-trigger">
          <span /><span /><span />
        </button>
      </div>
    </header>
    <div id="enlive-navigation" role="dialog" aria-modal="true" aria-label="Navigation" className={`enlive-menu ${menuOpen ? "enlive-menu-open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close navigation menu" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu} />
      <aside className="enlive-menu-panel">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <span className="enlive-eyebrow">Navigation</span>
          <button type="button" onClick={closeMenu} aria-label="Close navigation menu" className="enlive-menu-trigger"><span /><span /><span /></button>
        </div>
        <nav className="mt-8 space-y-8" aria-label="Main navigation">
          <MenuGroup title="Explore">{explore.map((item) => <MenuLink key={item} href="/leaderboard" onClick={closeMenu} active={item === "Leaderboard" && isActive}>{item}</MenuLink>)}</MenuGroup>
          <MenuGroup title="Business">
            {session ? <MenuLink href={`/target/${session.id}`} onClick={closeMenu}>My profile</MenuLink> : <MenuLink href="/users/auth/login" onClick={closeMenu}>Login</MenuLink>}
            <MenuLink href="/pricing" onClick={closeMenu}>Subscription plans</MenuLink>
          </MenuGroup>
          <MenuGroup title="About">
            <MenuLink href="/contributors" onClick={closeMenu}>Credits</MenuLink>
            <ThemeToggle variant="menu" />
          </MenuGroup>
          {session ? <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setSession(null); closeMenu(); router.push("/"); }} className="enlive-menu-item w-full text-left text-[var(--text-muted)]">Log out</button> : null}
        </nav>
      </aside>
    </div>
  </>;
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="enlive-eyebrow mb-2">{title}</h2><div>{children}</div></section>; }
function MenuLink({ href, children, onClick, active = false }: { href: string; children: React.ReactNode; onClick: () => void; active?: boolean }) { return <Link href={href} onClick={onClick} className={`enlive-menu-item ${active ? "enlive-menu-item-active" : ""}`}>{children}</Link>; }
