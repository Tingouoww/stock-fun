import Link from "next/link";

const links = [
  { href: "/", label: "總覽" },
  { href: "/market", label: "看盤" },
  { href: "/ledger", label: "記帳" },
  { href: "/learn", label: "教學" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-panel/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="font-semibold">我的台股</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-muted hover:text-text">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
