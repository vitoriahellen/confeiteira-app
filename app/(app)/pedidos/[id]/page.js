"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PedidoForm from "@/components/PedidoForm";

export default function PedidoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPedido(data.pedido);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [id]);

  async function handleSubmit(form) {
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
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
      setPedido(data.pedido);
      setEnviando(false);
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  async function handleExcluir() {
    if (!confirm("Tem certeza que deseja excluir este pedido? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
    router.push("/pedidos");
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;
  if (!pedido) return <p>Pedido não encontrado.</p>;

  return (
    <div>
      <Link href="/pedidos" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>← Voltar para pedidos</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.8rem", marginBottom: "1.2rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Pedido #{pedido.id}</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>{pedido.cliente_nome}</h1>
        </div>
        <button onClick={handleExcluir} className="btn btn-danger">Excluir pedido</button>
      </div>
      {erro && <p style={{ color: "#b23b3b", marginBottom: "1rem" }}>{erro}</p>}
      <PedidoForm inicial={pedido} onSubmit={handleSubmit} enviando={enviando} textoBotao="Salvar alterações" />
    </div>
  );
}
