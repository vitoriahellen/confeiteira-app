"use client";

import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState({ dias_lembrete_pagamento: "2", dias_alerta_entrega: "3" });
  const [zapiConfigurada, setZapiConfigurada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        setZapiConfigurada(Boolean(data.zapiConfigurada));
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSalvando(false);
    setSalvo(true);
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Configurações</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.4rem" }}>Lembretes automáticos</h1>

      <div className="card" style={{ padding: "1.4rem", marginBottom: "1.4rem", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: zapiConfigurada ? "var(--sage)" : "#c98a3f" }} />
          <strong>{zapiConfigurada ? "Z-API conectada" : "Z-API não configurada"}</strong>
        </div>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: "0.5rem" }}>
          {zapiConfigurada
            ? "As variáveis ZAPI_INSTANCE_ID e ZAPI_TOKEN estão definidas no projeto. Os lembretes de pagamento serão enviados automaticamente por WhatsApp."
            : "Defina as variáveis de ambiente ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN no painel do Vercel para ativar o envio automático de mensagens."}
        </p>
      </div>

      <form onSubmit={salvar} className="card" style={{ padding: "1.6rem", maxWidth: 560, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Lembrar pagamento com quantos dias de antecedência</label>
          <input
            className="input"
            type="number"
            min="0"
            value={config.dias_lembrete_pagamento}
            onChange={(e) => setConfig({ ...config, dias_lembrete_pagamento: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Alertar sobre entrega com quantos dias de antecedência</label>
          <input
            className="input"
            type="number"
            min="0"
            value={config.dias_alerta_entrega}
            onChange={(e) => setConfig({ ...config, dias_alerta_entrega: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar configurações"}
        </button>
        {salvo && <p style={{ color: "var(--sage)", fontSize: "0.85rem" }}>Configurações salvas.</p>}
      </form>
    </div>
  );
}
