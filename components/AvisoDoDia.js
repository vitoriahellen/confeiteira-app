"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Modal from "@/components/Modal";
import { obterDatasComemorativasParaAnos } from "@/lib/feriados";

function chaveHoje() {
  const hoje = new Date();
  return `aviso_${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

/** Popup diário (uma vez por dia) com entregas de hoje/amanhã e datas comemorativas próximas. */
export default function AvisoDoDia() {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    const chave = chaveHoje();
    if (localStorage.getItem(chave)) return;

    fetch("/api/pedidos")
      .then((r) => r.json())
      .then((data) => {
        const pedidos = data.pedidos || [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const fmt = (d) => format(d, "yyyy-MM-dd");
        const ativos = (p) => p.status !== "cancelado" && p.status !== "entregue";
        const entregasHoje = pedidos.filter((p) => ativos(p) && p.data_entrega?.slice(0, 10) === fmt(hoje));
        const entregasAmanha = pedidos.filter((p) => ativos(p) && p.data_entrega?.slice(0, 10) === fmt(amanha));

        const anos = new Set([hoje.getFullYear(), hoje.getFullYear() + 1]);
        const datas = obterDatasComemorativasParaAnos([...anos]);
        let comemorativaProxima = null;
        for (let i = 0; i <= 5; i++) {
          const d = new Date(hoje);
          d.setDate(d.getDate() + i);
          const info = datas[fmt(d)];
          if (info) {
            comemorativaProxima = { ...info, dias: i, data: d };
            break;
          }
        }

        if (entregasHoje.length === 0 && entregasAmanha.length === 0 && !comemorativaProxima) {
          localStorage.setItem(chave, "1");
          return;
        }

        setAviso({ entregasHoje, entregasAmanha, comemorativaProxima });
      })
      .catch(() => {});
  }, []);

  function fechar() {
    localStorage.setItem(chaveHoje(), "1");
    setAviso(null);
  }

  if (!aviso) return null;

  return (
    <Modal titulo="☀️ Resumo do dia" onClose={fechar}>
      {aviso.entregasHoje.length > 0 && (
        <ListaEntregas titulo={`📦 Entregas de hoje (${aviso.entregasHoje.length})`} pedidos={aviso.entregasHoje} onClick={fechar} />
      )}
      {aviso.entregasAmanha.length > 0 && (
        <ListaEntregas titulo={`📦 Entregas de amanhã (${aviso.entregasAmanha.length})`} pedidos={aviso.entregasAmanha} onClick={fechar} />
      )}
      {aviso.comemorativaProxima && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.3rem" }}>
            {aviso.comemorativaProxima.tipo === "feriado" ? "📌" : "🎉"} Data comemorativa próxima
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
            {aviso.comemorativaProxima.nome} —{" "}
            {aviso.comemorativaProxima.dias === 0
              ? "hoje"
              : aviso.comemorativaProxima.dias === 1
              ? "amanhã"
              : `em ${aviso.comemorativaProxima.dias} dias`}{" "}
            ({format(aviso.comemorativaProxima.data, "d 'de' MMMM", { locale: ptBR })})
          </p>
        </div>
      )}
      <button type="button" className="btn btn-primary" onClick={fechar} style={{ width: "100%" }}>
        Entendi
      </button>
    </Modal>
  );
}

function ListaEntregas({ titulo, pedidos, onClick }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.4rem" }}>{titulo}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {pedidos.map((p) => (
          <Link
            key={p.id}
            href={`/pedidos/${p.id}`}
            onClick={onClick}
            style={{ display: "block", fontSize: "0.85rem", padding: "0.5rem 0.6rem", borderRadius: 8, background: "var(--brand-soft)" }}
          >
            <strong>{p.cliente_nome}</strong>
            <span style={{ color: "var(--ink-soft)" }}> — {p.itens}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
