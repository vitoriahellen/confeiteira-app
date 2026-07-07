"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Kanban from "@/components/Kanban";
import { listarLembretes, porPedido } from "@/lib/lembretes";

const STATUS_LABEL = {
  novo: "Novo",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [visualizacao, setVisualizacao] = useState("kanban"); // 'kanban' | 'lista'

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    fetch("/api/pedidos")
      .then((r) => r.json())
      .then((data) => {
        setPedidos(data.pedidos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }

  async function atualizarPedido(id, campos) {
    const anterior = pedidos;
    setPedidos((atual) => atual.map((p) => (p.id === id ? { ...p, ...campos } : p)));
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });
      if (!res.ok) throw new Error("falha ao salvar");
    } catch {
      setPedidos(anterior);
    }
  }

  function handleStatusChange(id, novoStatus) {
    atualizarPedido(id, { status: novoStatus });
  }

  function handleTogglePagamento(id, campo, valorAtual) {
    atualizarPedido(id, { [campo]: !valorAtual });
  }

  const filtrados = filtroStatus
    ? pedidos.filter((p) => p.status === filtroStatus)
    : pedidos;

  const lembretesPorPedido = porPedido(listarLembretes(pedidos));

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.6rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Pedidos</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>Todas as encomendas</h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="card" style={{ display: "flex", padding: 4 }}>
            <button
              onClick={() => setVisualizacao("kanban")}
              className="btn"
              style={{
                background: visualizacao === "kanban" ? "var(--accent)" : "transparent",
                color: visualizacao === "kanban" ? "#fff" : "var(--ink-soft)",
                padding: "0.4rem 0.9rem",
              }}
            >
              Kanban
            </button>
            <button
              onClick={() => setVisualizacao("lista")}
              className="btn"
              style={{
                background: visualizacao === "lista" ? "var(--accent)" : "transparent",
                color: visualizacao === "lista" ? "#fff" : "var(--ink-soft)",
                padding: "0.4rem 0.9rem",
              }}
            >
              Lista
            </button>
          </div>
          <Link href="/pedidos/novo" className="btn btn-primary">+ Novo pedido</Link>
        </div>
      </header>

      {visualizacao === "lista" && (
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          <FiltroBotao label="Todos" ativo={filtroStatus === ""} onClick={() => setFiltroStatus("")} />
          {Object.entries(STATUS_LABEL).map(([valor, label]) => (
            <FiltroBotao key={valor} label={label} ativo={filtroStatus === valor} onClick={() => setFiltroStatus(valor)} />
          ))}
        </div>
      )}

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhum pedido encontrado.</p>
      ) : visualizacao === "kanban" ? (
        <Kanban
          pedidos={pedidos}
          lembretesPorPedido={lembretesPorPedido}
          onStatusChange={handleStatusChange}
          onTogglePagamento={handleTogglePagamento}
        />
      ) : filtrados.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhum pedido encontrado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {filtrados.map((p) => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              className="index-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <strong>{p.cliente_nome}</strong>
                  <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>{p.itens}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  entrega {format(new Date(p.data_entrega), "dd/MM/yyyy")}
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>
                  R$ {Number(p.valor_total).toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FiltroBotao({ label, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        background: ativo ? "var(--accent)" : "var(--card)",
        color: ativo ? "#fff" : "var(--ink-soft)",
        border: `1px solid ${ativo ? "var(--accent)" : "var(--card-border)"}`,
        padding: "0.4rem 0.8rem",
        fontSize: "0.82rem",
      }}
    >
      {label}
    </button>
  );
}
