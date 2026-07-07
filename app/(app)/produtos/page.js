"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
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
    fetch(`/api/produtos?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProdutos(data.produtos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.6rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Produtos</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>Catálogo de produtos</h1>
        </div>
        <Link href="/produtos/novo" className="btn btn-primary">+ Novo produto</Link>
      </header>

      <input
        className="input"
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ maxWidth: 320, marginBottom: "1.2rem" }}
      />

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando produtos...</p>
      ) : produtos.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhum produto cadastrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {produtos.map((p) => (
            <Link
              key={p.id}
              href={`/produtos/${p.id}`}
              className="index-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
              <div>
                <strong>{p.nome}</strong>
                <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)", marginLeft: "0.5rem" }}>
                  {p.unidade}
                </span>
                {p.descricao && (
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>{p.descricao}</div>
                )}
              </div>
              <div className="mono" style={{ fontWeight: 600 }}>R$ {Number(p.preco_padrao).toFixed(2)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
