import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { currentUser, logout, type Session } from "@/lib/clinic";

const NAV = [
  { href: "/painel", label: "Painel", admin: false },
  { href: "/pacientes", label: "Pacientes", admin: false },
  { href: "/agenda", label: "Agenda", admin: false },
  { href: "/receitas", label: "Receitas", admin: false },
  { href: "/financeiro", label: "Financeiro", admin: true },
  { href: "/usuarios", label: "Usuários", admin: true },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = currentUser();
    setUser(u);
    setReady(true);
    if (!u) navigate({ to: "/" });
    else if (u.role !== "admin" && (path.startsWith("/financeiro") || path.startsWith("/usuarios"))) navigate({ to: "/painel" });
  }, [path, navigate]);

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center text-taupe">Carregando…</div>;
  }

  const links = NAV.filter((n) => !n.admin || user.role === "admin");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-parchment bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/painel" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Lorhany Batista" className="h-12 w-12 rounded-full object-cover ring-1 ring-parchment" />
            <div>
              <div className="font-serif text-sm tracking-[0.18em] text-gold-dark">LORHANY BATISTA</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-taupe">Saúde e Estética</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`rounded-md px-3 py-1.5 text-sm ${path.startsWith(l.href) ? "bg-cream text-gold-dark" : "text-taupe hover:bg-cream"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-taupe sm:block">{user.name}</span>
            <button
              className="btn-ghost !py-1.5"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} to={l.href} className={`whitespace-nowrap rounded-md px-3 py-1 text-sm ${path.startsWith(l.href) ? "bg-cream text-gold-dark" : "text-taupe"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
