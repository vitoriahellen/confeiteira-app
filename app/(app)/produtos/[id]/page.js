"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProdutoForm from "@/components/ProdutoForm";

export default function ProdutoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/produtos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduto(data.produto);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [id]);

  async function handleSubmit(form) {
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível salvar.");
        setEnviando(false);
        return;
      }
      setProduto(data.produto);
      setEnviando(false);
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  async function handleExcluir() {
    if (!confirm("Tem certeza que deseja remover este produto? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    router.push("/produtos");
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;
  if (!produto) return <p>Produto não encontrado.</p>;

  return (
    <div>
      <Link href="/produtos" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>← Voltar para produtos</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.8rem", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.6rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Produto</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>{produto.nome}</h1>
        </div>
        <button onClick={handleExcluir} className="btn btn-danger">Remover produto</button>
      </div>
      {erro && <p style={{ color: "#b23b3b", marginBottom: "1rem" }}>{erro}</p>}
      <ProdutoForm inicial={produto} onSubmit={handleSubmit} enviando={enviando} textoBotao="Salvar alterações" />
    </div>
  );
}
