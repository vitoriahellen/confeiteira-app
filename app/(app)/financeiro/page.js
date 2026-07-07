"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import CartaoKpi from "@/components/CartaoKpi";

const PERIODOS = [
  { valor: "7", label: "7 dias" },
  { valor: "30", label: "30 dias" },
  { valor: "60", label: "60 dias" },
  { valor: "90", label: "90 dias" },
  { valor: "todos", label: "Tudo" },
  { valor: "custom", label: "Personalizado" },
];

const STATUS_PEDIDO = [
  { valor: "todos", label: "Todos os status" },
  { valor: "novo", label: "Novo" },
  { valor: "em_producao", label: "Em produção" },
  { valor: "pronto", label: "Pronto" },
  { valor: "entregue", label: "Entregue" },
  { valor: "cancelado", label: "Cancelado" },
];

function calcularPeriodo(preset) {
  if (preset === "todos") return { de: null, ate: null };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (Number(preset) - 1));
  return { de: format(inicio, "yyyy-MM-dd"), ate: format(hoje, "yyyy-MM-dd") };
}

function agruparPorCliente(pedidos, incluirCancelado) {
  const mapa = {};
  for (const p of pedidos) {
    if (!incluirCancelado && p.status === "cancelado") continue;
    const chave = (p.cliente_nome || "").trim().toLowerCase();
    if (!chave) continue;
    if (!mapa[chave]) {
      mapa[chave] = {
        cliente: p.cliente_nome,
        telefone: p.cliente_telefone,
        pedidos: [],
        faturado: 0,
        recebido: 0,
      };
    }
    const grupo = mapa[chave];
    grupo.pedidos.push(p);
    if (!grupo.telefone && p.cliente_telefone) grupo.telefone = p.cliente_telefone;

    const sinal = Number(p.valor_sinal) || 0;
    const total = Number(p.valor_total) || 0;
    const restante = total - sinal;
    grupo.faturado += total;
    if (p.sinal_pago) grupo.recebido += sinal;
    if (p.restante_pago) grupo.recebido += restante;
  }

  return Object.values(mapa)
    .map((g) => ({ ...g, emAberto: g.faturado - g.recebido }))
    .sort((a, b) => b.emAberto - a.emAberto);
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState("30");
  const [deCustom, setDeCustom] = useState("");
  const [ateCustom, setAteCustom] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos"); // 'todos' | 'aberto' | 'quitado' (pagamento)
  const [statusPedido, setStatusPedido] = useState("todos"); // status do pedido (novo/em_producao/...)
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    setCarregando(true);
    const { de, ate } = periodo === "custom"
      ? { de: deCustom || null, ate: ateCustom || null }
      : calcularPeriodo(periodo);
    const params = new URLSearchParams();
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);
    if (statusPedido !== "todos") params.set("status", statusPedido);
    fetch(`/api/pedidos?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPedidos(data.pedidos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, [periodo, deCustom, ateCustom, statusPedido]);

  const clientes = useMemo(() => {
    let grupos = agruparPorCliente(pedidos, statusPedido !== "todos");

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      grupos = grupos.filter((g) => g.cliente.toLowerCase().includes(termo));
    }

    if (statusFiltro === "aberto") grupos = grupos.filter((g) => g.emAberto > 0.01);
    if (statusFiltro === "quitado") grupos = grupos.filter((g) => g.emAberto <= 0.01);

    return grupos;
  }, [pedidos, busca, statusFiltro, statusPedido]);

  const totais = useMemo(
    () =>
      clientes.reduce(
        (acc, g) => ({
          faturado: acc.faturado + g.faturado,
          recebido: acc.recebido + g.recebido,
          emAberto: acc.emAberto + g.emAberto,
        }),
        { faturado: 0, recebido: 0, emAberto: 0 }
      ),
    [clientes]
  );

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Financeiro</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.4rem" }}>
        Faturamento por cliente
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        <div className="card" style={{ display: "flex", padding: 4 }}>
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPeriodo(p.valor)}
              className="btn"
              style={{
                background: periodo === p.valor ? "var(--accent)" : "transparent",
                color: periodo === p.valor ? "#fff" : "var(--ink-soft)",
                padding: "0.35rem 0.8rem",
                fontSize: "0.82rem",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: 200 }}
          />
          <select
            className="input"
            value={statusPedido}
            onChange={(e) => setStatusPedido(e.target.value)}
            style={{ width: 170 }}
          >
            {STATUS_PEDIDO.map((s) => (
              <option key={s.valor} value={s.valor}>{s.label}</option>
            ))}
          </select>
          <select
            className="input"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="todos">Todos os pagamentos</option>
            <option value="aberto">Com valor em aberto</option>
            <option value="quitado">Quitados</option>
          </select>
        </div>
      </div>

      {periodo === "custom" && (
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1.2rem" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>De</label>
          <input
            className="input"
            type="date"
            value={deCustom}
            onChange={(e) => setDeCustom(e.target.value)}
            style={{ width: 170 }}
          />
          <label style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Até</label>
          <input
            className="input"
            type="date"
            value={ateCustom}
            onChange={(e) => setAteCustom(e.target.value)}
            style={{ width: 170 }}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.9rem", marginBottom: "1.8rem" }}>
        <CartaoKpi icone="🧾" cor="var(--brand-soft)" corIcone="var(--brand)" label="Faturado no período" valor={`R$ ${totais.faturado.toFixed(2)}`} />
        <CartaoKpi icone="✅" cor="var(--sage-bg)" corIcone="var(--sage)" label="Recebido" valor={`R$ ${totais.recebido.toFixed(2)}`} />
        <CartaoKpi icone="⏳" cor="var(--purple-bg)" corIcone="var(--purple)" label="Em aberto" valor={`R$ ${totais.emAberto.toFixed(2)}`} />
      </div>

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
      ) : clientes.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhum cliente encontrado para esse filtro.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {clientes.map((g) => {
            const chave = g.cliente.toLowerCase();
            const aberto = expandido === chave;
            return (
              <div key={chave} className="index-card">
                <div
                  onClick={() => setExpandido(aberto ? null : chave)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <strong>{g.cliente}</strong>
                      <span
                        className="badge"
                        style={{
                          background: g.emAberto > 0.01 ? "var(--purple-bg)" : "var(--sage-bg)",
                          color: g.emAberto > 0.01 ? "var(--purple)" : "var(--sage)",
                        }}
                      >
                        {g.emAberto > 0.01 ? "Em aberto" : "Quitado"}
                      </span>
                    </div>
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                      {g.pedidos.length} pedido{g.pedidos.length > 1 ? "s" : ""}
                      {g.telefone ? ` · ${g.telefone}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1.4rem", textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Faturado</div>
                      <div className="mono" style={{ fontWeight: 600 }}>R$ {g.faturado.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Recebido</div>
                      <div className="mono" style={{ fontWeight: 600, color: "var(--sage)" }}>R$ {g.recebido.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Em aberto</div>
                      <div className="mono" style={{ fontWeight: 600, color: g.emAberto > 0.01 ? "var(--accent-dark)" : "var(--ink)" }}>
                        R$ {g.emAberto.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {aberto && (
                  <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid var(--card-border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {g.pedidos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/pedidos/${p.id}`)}
                        style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        <span>
                          {format(new Date(p.data_entrega), "dd/MM/yyyy")} · {p.itens}
                        </span>
                        <span className="mono">R$ {Number(p.valor_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
