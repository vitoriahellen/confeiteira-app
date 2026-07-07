"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const LINKS = [
  { href: "/dashboard", label: "Agenda", icon: "📅" },
  { href: "/pedidos", label: "Pedidos", icon: "🧁" },
  { href: "/produtos", label: "Produtos", icon: "🎂" },
  { href: "/clientes", label: "Clientes", icon: "📇" },
  { href: "/financeiro", label: "Financeiro", icon: "💰" },
  { href: "/mensageria", label: "Mensageria", icon: "📨" },
  { href: "/usuarios", label: "Usuárias", icon: "👥", adminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️", adminOnly: true },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setLogoUrl(data.config?.logo_url || ""))
      .catch(() => {});
  }, []);

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
          background: "#fff",
          borderRight: "1px solid var(--card-border)",
          padding: "1.4rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        <div style={{ padding: "0.4rem 0.6rem 1.6rem" }}>
          <Logo variant="sidebar" logoUrl={logoUrl} />
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
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.6rem 0.7rem",
              marginBottom: "0.6rem",
              border: "1px solid var(--card-border)",
              boxShadow: "none",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--brand-soft)",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {user?.nome?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div style={{ lineHeight: 1.2, overflow: "hidden" }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.nome}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                {user?.papel === "admin" ? "Administradora" : "Membro"}
              </div>
            </div>
          </div>
          <button onClick={sair} className="btn btn-outline" style={{ width: "100%" }}>
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem 2.4rem", maxWidth: 1360, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </main>
    </div>
  );
}
