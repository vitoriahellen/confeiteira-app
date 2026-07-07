"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarDataRelativa } from "@/lib/lembretes";

const COLUNAS = [
  { status: "novo", titulo: "Novo" },
  { status: "em_producao", titulo: "Em produção" },
  { status: "pronto", titulo: "Pronto" },
  { status: "entregue", titulo: "Entregue" },
  { status: "cancelado", titulo: "Cancelado" },
];

export default function Kanban({ pedidos, lembretesPorPedido, onStatusChange, onTogglePagamento }) {
  const [origemArrasto, setOrigemArrasto] = useState(null);
  const [colunaAlvo, setColunaAlvo] = useState(null);

  const porColuna = {};
  for (const c of COLUNAS) porColuna[c.status] = [];
  for (const p of pedidos) {
    if (porColuna[p.status]) porColuna[p.status].push(p);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLUNAS.length}, minmax(0, 1fr))`,
        gap: "0.9rem",
        alignItems: "start",
      }}
    >
      {COLUNAS.map((coluna) => (
        <div
          key={coluna.status}
          onDragOver={(e) => {
            e.preventDefault();
            setColunaAlvo(coluna.status);
          }}
          onDragLeave={() =>
            setColunaAlvo((atual) => (atual === coluna.status ? null : atual))
          }
          onDrop={(e) => {
            e.preventDefault();
            setColunaAlvo(null);
            const pedidoId = Number(e.dataTransfer.getData("text/plain"));
            if (pedidoId && origemArrasto && origemArrasto.status !== coluna.status) {
              onStatusChange(pedidoId, coluna.status);
            }
            setOrigemArrasto(null);
          }}
          style={{
            background: colunaAlvo === coluna.status ? "var(--brand-soft)" : "transparent",
            borderRadius: 14,
            padding: "0.4rem",
            minHeight: 160,
            transition: "background 0.12s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.3rem 0.4rem 0.7rem",
            }}
          >
            <span className={`badge badge-${coluna.status}`}>{coluna.titulo}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              {porColuna[coluna.status].length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {porColuna[coluna.status].map((p) => (
              <CartaoPedido
                key={p.id}
                pedido={p}
                lembrete={lembretesPorPedido?.[p.id]}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(p.id));
                  setOrigemArrasto(p);
                }}
                onDragEnd={() => setOrigemArrasto(null)}
                onTogglePagamento={onTogglePagamento}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CartaoPedido({ pedido, lembrete, onDragStart, onDragEnd, onTogglePagamento }) {
  const router = useRouter();
  const temRestante = Number(pedido.valor_total) > Number(pedido.valor_sinal);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => router.push(`/pedidos/${pedido.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/pedidos/${pedido.id}`);
      }}
      className="index-card"
      style={{ cursor: "grab", padding: "0.8rem 0.9rem" }}
    >
      <strong style={{ display: "block", fontSize: "0.92rem" }}>{pedido.cliente_nome}</strong>
      <div
        style={{
          color: "var(--ink-soft)",
          fontSize: "0.82rem",
          margin: "0.15rem 0 0.5rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {pedido.itens}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.78rem",
          color: "var(--ink-soft)",
          marginBottom: "0.5rem",
        }}
      >
        <span>{format(new Date(pedido.data_entrega), "dd/MM", { locale: ptBR })}</span>
        <span className="mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
          R$ {Number(pedido.valor_total).toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        <PilulaPagamento
          rotuloPago="Sinal pago"
          rotuloPendente="Sinal pendente"
          pago={pedido.sinal_pago}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePagamento(pedido.id, "sinal_pago", pedido.sinal_pago);
          }}
        />
        {temRestante && (
          <PilulaPagamento
            rotuloPago="Restante pago"
            rotuloPendente="Restante pendente"
            pago={pedido.restante_pago}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePagamento(pedido.id, "restante_pago", pedido.restante_pago);
            }}
          />
        )}
      </div>

      {lembrete && (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.75rem",
            color: lembrete.enviado ? "var(--sage)" : "var(--accent-dark)",
          }}
        >
          🔔 {lembrete.texto} · {lembrete.enviado ? "enviado" : formatarDataRelativa(lembrete.data)}
        </div>
      )}
    </div>
  );
}

function PilulaPagamento({ pago, rotuloPago, rotuloPendente, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="badge"
      style={{
        border: "none",
        cursor: "pointer",
        background: pago ? "var(--sage-bg)" : "var(--brand-soft)",
        color: pago ? "var(--sage)" : "var(--accent-dark)",
      }}
    >
      {pago ? `✓ ${rotuloPago}` : rotuloPendente}
    </button>
  );
}
