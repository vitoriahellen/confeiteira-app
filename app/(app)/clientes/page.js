"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { linkWhatsApp } from "@/lib/lembretes";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const atraso = setTimeout(() => carregar(busca), 250);
    return () => clearTimeout(atraso);
  }, [busca]);

  function carregar(termo) {
    setCarregando(true);
    const params = new URLSearchParams();
    if (termo) params.set("busca", termo);
    fetch(`/api/clientes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setClientes(data.clientes || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.6rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Clientes</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>Cadastro de clientes</h1>
        </div>
        <Link href="/clientes/novo" className="btn btn-primary">+ Novo cliente</Link>
      </header>

      <input
        className="input"
        placeholder="Buscar por nome ou WhatsApp..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ maxWidth: 320, marginBottom: "1.2rem" }}
      />

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando clientes...</p>
      ) : clientes.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhuma cliente cadastrada.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {clientes.map((c) => {
            const whatsapp = linkWhatsApp(c.telefone, `Olá, ${c.nome}!`);
            return (
              <div
                key={c.id}
                className="index-card"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
              >
                <Link href={`/clientes/${c.id}`} style={{ flex: 1, display: "block" }}>
                  <strong>{c.nome}</strong>
                  {c.endereco && (
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                      {c.endereco}
                    </div>
                  )}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span className="mono" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                    {c.telefone || "sem WhatsApp"}
                  </span>
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Conversar no WhatsApp"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "var(--sage)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        textDecoration: "none",
                      }}
                    >
                      ✆
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
