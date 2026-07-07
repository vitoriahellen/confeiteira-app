"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PedidoForm from "@/components/PedidoForm";

export default function NovoPedidoPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(form) {
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível salvar o pedido.");
        setEnviando(false);
        return;
      }
      router.push(`/pedidos/${data.pedido.id}`);
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Pedidos</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.2rem" }}>Novo pedido</h1>
      {erro && <p style={{ color: "#b23b3b", marginBottom: "1rem" }}>{erro}</p>}
      <PedidoForm onSubmit={handleSubmit} enviando={enviando} textoBotao="Criar pedido" />
    </div>
  );
}
