"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClienteForm from "@/components/ClienteForm";

export default function ClienteDetalhePage() {
  const { id } = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCliente(data.cliente);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [id]);

  async function handleSubmit(form) {
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(`/api/clientes/${id}`, {
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
      setCliente(data.cliente);
      setEnviando(false);
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  async function handleExcluir() {
    if (!confirm("Tem certeza que deseja remover esta cliente? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    router.push("/clientes");
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;
  if (!cliente) return <p>Cliente não encontrada.</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.2rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Cliente</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>{cliente.nome}</h1>
        </div>
        <button onClick={handleExcluir} className="btn btn-danger">Remover cliente</button>
      </div>
      {erro && <p style={{ color: "#b23b3b", marginBottom: "1rem" }}>{erro}</p>}
      <ClienteForm inicial={cliente} onSubmit={handleSubmit} enviando={enviando} textoBotao="Salvar alterações" />
    </div>
  );
}
