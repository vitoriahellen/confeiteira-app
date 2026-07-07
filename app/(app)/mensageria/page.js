"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listarLembretes, formatarDataRelativa, linkWhatsApp, mensagemPadrao } from "@/lib/lembretes";

const TIPO_LABEL = {
  sinal: { texto: "Cobrar sinal", cor: "var(--purple)", fundo: "var(--purple-bg)" },
  restante: { texto: "Cobrar restante", cor: "var(--accent-dark)", fundo: "var(--brand-soft)" },
  entrega: { texto: "Alerta de entrega", cor: "var(--honey)", fundo: "#fdf1de" },
};

export default function MensageriaPage() {
  const [pedidos, setPedidos] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("pendentes"); // 'todos' | 'pendentes' | 'enviados'
  const [enviando, setEnviando] = useState(null); // chave `${pedidoId}-${tipo}` em andamento
  const [erros, setErros] = useState({});

  useEffect(() => {
    setCarregando(true);
    fetch("/api/pedidos")
      .then((r) => r.json())
      .then((data) => {
        setPedidos(data.pedidos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setTemplates(data.config || null))
      .catch(() => {});
  }, []);

  const itens = useMemo(() => listarLembretes(pedidos), [pedidos]);

  const itensFiltrados = useMemo(() => {
    if (filtro === "pendentes") return itens.filter((i) => !i.enviado);
    if (filtro === "enviados") return itens.filter((i) => i.enviado);
    return itens;
  }, [itens, filtro]);

  const pendentesCount = itens.filter((i) => !i.enviado).length;

  async function notificarAgora(item) {
    const chave = `${item.pedidoId}-${item.tipo}`;
    setEnviando(chave);
    setErros((atual) => ({ ...atual, [chave]: "" }));
    try {
      const res = await fetch("/api/mensageria/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: item.pedidoId, tipo: item.tipo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErros((atual) => ({ ...atual, [chave]: data.error || "Não foi possível enviar." }));
        setEnviando(null);
        return;
      }
      setPedidos((atual) =>
        atual.map((p) =>
          p.id === item.pedidoId
            ? { ...p, lembretes_enviados: [...(p.lembretes_enviados || []), item.tipo] }
            : p
        )
      );
      setEnviando(null);
    } catch {
      setErros((atual) => ({ ...atual, [chave]: "Erro de conexão." }));
      setEnviando(null);
    }
  }

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Mensageria</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>
        Agenda de cobranças e lembretes
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
        Aqui ficam registradas as próximas cobranças de sinal/restante e os alertas de entrega — o
        sistema verifica tudo automaticamente 1x por dia, às 09h (horário de Brasília). Use
        &quot;Notificar agora&quot; pra disparar uma mensagem na hora, sem esperar a verificação automática.
      </p>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        <FiltroBotao label={`Pendentes (${pendentesCount})`} ativo={filtro === "pendentes"} onClick={() => setFiltro("pendentes")} />
        <FiltroBotao label="Enviados" ativo={filtro === "enviados"} onClick={() => setFiltro("enviados")} />
        <FiltroBotao label="Todos" ativo={filtro === "todos"} onClick={() => setFiltro("todos")} />
      </div>

      {carregando ? (
        <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhuma mensagem por aqui.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {itensFiltrados.map((item) => {
            const rotulo = TIPO_LABEL[item.tipo];
            const chave = `${item.pedidoId}-${item.tipo}`;
            const link = !item.enviado && item.tipo !== "entrega"
              ? linkWhatsApp(item.telefone, mensagemPadrao(item, templates))
              : null;
            const enviandoEsta = enviando === chave;
            const erro = erros[chave];
            return (
              <div key={chave} className="index-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flex: 1, minWidth: 0 }}>
                    <span className="badge" style={{ background: rotulo.fundo, color: rotulo.cor, flexShrink: 0 }}>
                      {rotulo.texto}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/pedidos/${item.pedidoId}`} style={{ fontWeight: 600 }}>
                        {item.cliente}
                      </Link>
                      <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.pedido.itens}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{formatarDataRelativa(item.data)}</div>
                    <div style={{ fontSize: "0.78rem", color: item.enviado ? "var(--sage)" : "var(--ink-soft)" }}>
                      {item.enviado ? "✓ Enviado" : "Pendente"}
                    </div>
                  </div>

                  {!item.enviado && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => notificarAgora(item)}
                        disabled={enviandoEsta}
                        style={{ fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                      >
                        {enviandoEsta ? "Enviando..." : "Notificar agora"}
                      </button>

                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar pelo WhatsApp Web"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "var(--sage)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            textDecoration: "none",
                          }}
                        >
                          ✆
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {erro && <p style={{ color: "#b23b3b", fontSize: "0.8rem", marginTop: "0.5rem" }}>{erro}</p>}
              </div>
            );
          })}
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
