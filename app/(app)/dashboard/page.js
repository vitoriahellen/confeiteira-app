"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addWeeks,
  addMonths,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL = {
  novo: "Novo",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const [modo, setModo] = useState("semana"); // 'semana' | 'mes'
  const [referencia, setReferencia] = useState(new Date());
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    setCarregando(true);
    fetch("/api/pedidos")
      .then((r) => r.json())
      .then((data) => {
        setPedidos(data.pedidos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUsuario(data.user))
      .catch(() => {});
  }, []);

  const pedidosPorDia = useMemo(() => {
    const mapa = {};
    for (const p of pedidos) {
      const chave = p.data_entrega?.slice(0, 10);
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(p);
    }
    return mapa;
  }, [pedidos]);

  const dias = useMemo(() => {
    if (modo === "semana") {
      const inicio = startOfWeek(referencia, { weekStartsOn: 1 });
      const fim = endOfWeek(referencia, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: inicio, end: fim });
    }
    const inicio = startOfWeek(startOfMonth(referencia), { weekStartsOn: 1 });
    const fim = endOfWeek(endOfMonth(referencia), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [modo, referencia]);

  function navegar(direcao) {
    setReferencia((atual) =>
      modo === "semana" ? addWeeks(atual, direcao) : addMonths(atual, direcao)
    );
  }

  const pedidosDoDiaSelecionado = diaSelecionado
    ? pedidosPorDia[format(diaSelecionado, "yyyy-MM-dd")] || []
    : [];

  return (
    <div>
      {usuario?.nome && (
        <div style={{ marginBottom: "1.4rem" }}>
          <h1 className="display" style={{ fontSize: "1.7rem", margin: 0 }}>
            {saudacao()}, {usuario.nome.split(" ")[0]}! 🌸
          </h1>
          <p style={{ color: "var(--ink-soft)", margin: "0.2rem 0 0" }}>
            Que tal mais um dia doce e produtivo?
          </p>
        </div>
      )}

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.6rem" }}>
        <div>
          <p className="label" style={{ color: "var(--accent)" }}>Agenda</p>
          <h1 className="display" style={{ fontSize: "1.8rem", margin: 0 }}>
            {format(referencia, modo === "semana" ? "'Semana de' d 'de' MMMM" : "MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="card" style={{ display: "flex", padding: 4 }}>
            <button
              onClick={() => setModo("semana")}
              className="btn"
              style={{
                background: modo === "semana" ? "var(--accent)" : "transparent",
                color: modo === "semana" ? "#fff" : "var(--ink-soft)",
                padding: "0.4rem 0.9rem",
              }}
            >
              Semana
            </button>
            <button
              onClick={() => setModo("mes")}
              className="btn"
              style={{
                background: modo === "mes" ? "var(--accent)" : "transparent",
                color: modo === "mes" ? "#fff" : "var(--ink-soft)",
                padding: "0.4rem 0.9rem",
              }}
            >
              Mês
            </button>
          </div>
          <button onClick={() => navegar(-1)} className="btn btn-outline">←</button>
          <button onClick={() => setReferencia(new Date())} className="btn btn-outline">Hoje</button>
          <button onClick={() => navegar(1)} className="btn btn-outline">→</button>
          <Link href="/pedidos/novo" className="btn btn-primary">+ Novo pedido</Link>
        </div>
      </header>

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando agenda...</p>
      ) : modo === "semana" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.8rem" }}>
          {dias.map((dia) => {
            const chave = format(dia, "yyyy-MM-dd");
            const doDia = pedidosPorDia[chave] || [];
            return (
              <div key={chave} className="card" style={{ padding: "0.8rem", minHeight: 220, background: isToday(dia) ? "var(--brand-soft)" : "var(--card)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", textTransform: "uppercase", margin: 0 }}>
                  {format(dia, "EEE", { locale: ptBR })}
                </p>
                <p className="display" style={{ fontSize: "1.2rem", margin: "0 0 0.6rem" }}>
                  {format(dia, "d")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {doDia.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pedidos/${p.id}`}
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        padding: "0.4rem 0.5rem",
                        borderRadius: 8,
                        background: "var(--brand-soft)",
                        color: "var(--ink)",
                      }}
                    >
                      <strong>{p.cliente_nome}</strong>
                      <br />
                      <span style={{ color: "var(--ink-soft)" }}>{p.itens}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", marginBottom: "0.4rem" }}>
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
              <p key={d} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>{d}</p>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {dias.map((dia) => {
              const chave = format(dia, "yyyy-MM-dd");
              const doDia = pedidosPorDia[chave] || [];
              const foraDoMes = !isSameMonth(dia, referencia);
              return (
                <button
                  key={chave}
                  onClick={() => setDiaSelecionado(dia)}
                  className="card"
                  style={{
                    padding: "0.5rem",
                    minHeight: 78,
                    textAlign: "left",
                    cursor: "pointer",
                    opacity: foraDoMes ? 0.4 : 1,
                    background: diaSelecionado && isSameDay(dia, diaSelecionado) ? "var(--brand-soft)" : "var(--card)",
                    border: isToday(dia) ? "1px solid var(--accent)" : "1px solid var(--card-border)",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{format(dia, "d")}</div>
                  {doDia.length > 0 && (
                    <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                      {doDia.slice(0, 4).map((p) => (
                        <span key={p.id} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {diaSelecionado && (
            <div style={{ marginTop: "1.4rem" }}>
              <h3 className="display" style={{ fontSize: "1.1rem" }}>
                {format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
              </h3>
              {pedidosDoDiaSelecionado.length === 0 ? (
                <p style={{ color: "var(--ink-soft)" }}>Nenhuma entrega neste dia.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {pedidosDoDiaSelecionado.map((p) => (
                    <Link key={p.id} href={`/pedidos/${p.id}`} className="index-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{p.cliente_nome}</strong>
                        <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>{p.itens}</div>
                      </div>
                      <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
