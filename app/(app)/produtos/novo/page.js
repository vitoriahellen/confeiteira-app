"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProdutoForm from "@/components/ProdutoForm";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(form) {
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível salvar o produto.");
        setEnviando(false);
        return;
      }
      router.push("/produtos");
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  return (
    <div>
      <Link href="/produtos" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>← Voltar para produtos</Link>
      <p className="label" style={{ color: "var(--accent)", marginTop: "0.8rem" }}>Produtos</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.2rem" }}>Novo produto</h1>
      {erro && <p style={{ color: "#b23b3b", marginBottom: "1rem" }}>{erro}</p>}
      <ProdutoForm onSubmit={handleSubmit} enviando={enviando} textoBotao="Criar produto" />
    </div>
  );
}
