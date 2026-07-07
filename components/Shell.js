"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Agenda", icon: "📅" },
  { href: "/pedidos", label: "Pedidos", icon: "🧁" },
  { href: "/usuarios", label: "Usuárias", icon: "👥", adminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️", adminOnly: true },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          borderRight: "1px solid var(--card-border)",
          padding: "1.4rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        <div style={{ padding: "0.4rem 0.6rem 1.4rem" }}>
          <p className="display" style={{ fontSize: "1.25rem", margin: 0 }}>
            Caderno
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>
            gestão de encomendas
          </p>
        </div>

        {LINKS.filter((l) => !l.adminOnly || user?.papel === "admin").map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}

        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
              marginBottom: "0.6rem",
              padding: "0 0.6rem",
            }}
          >
            {user?.nome} {user?.papel === "admin" ? "· admin" : ""}
          </div>
          <button onClick={sair} className="btn btn-outline" style={{ width: "100%" }}>
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem 2.4rem", maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
