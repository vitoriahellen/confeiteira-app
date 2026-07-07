"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState({
    dias_lembrete_pagamento: "2",
    dias_alerta_entrega: "3",
  });
  const [zapiConfigurada, setZapiConfigurada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [nomeArquivoLogo, setNomeArquivoLogo] = useState("");
  const [salvandoLogo, setSalvandoLogo] = useState(false);
  const [erroLogo, setErroLogo] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        setLogoUrl(data.config?.logo_url || "");
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

  function handleArquivoLogo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroLogo("Selecione um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 1_000_000) {
      setErroLogo("A imagem deve ter no máximo 1MB.");
      return;
    }
    setErroLogo("");
    setNomeArquivoLogo(arquivo.name);
    const leitor = new FileReader();
    leitor.onload = () => setLogoUrl(leitor.result);
    leitor.readAsDataURL(arquivo);
  }

  async function salvarLogo(valor) {
    setSalvandoLogo(true);
    setErroLogo("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: valor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErroLogo(data.error || "Não foi possível salvar a logo.");
        setSalvandoLogo(false);
        return;
      }
      window.location.reload();
    } catch {
      setErroLogo("Erro de conexão.");
      setSalvandoLogo(false);
    }
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Configurações</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.4rem" }}>Aparência e lembretes</h1>

      <div className="card" style={{ padding: "1.4rem", marginBottom: "1.4rem", maxWidth: 560 }}>
        <h3 className="display" style={{ fontSize: "1.05rem", margin: "0 0 0.9rem" }}>Logo do sistema</h3>
        <div style={{ marginBottom: "1rem" }}>
          <Logo variant="sidebar" logoUrl={logoUrl} />
        </div>
        <label className="label">Enviar uma imagem (até 1MB)</label>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.6rem" }}>
          <label className="btn btn-outline" htmlFor="logo-upload" style={{ cursor: "pointer" }}>
            Escolher imagem
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleArquivoLogo}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
            {nomeArquivoLogo || "Nenhum arquivo escolhido"}
          </span>
        </div>
        {erroLogo && <p style={{ color: "#b23b3b", fontSize: "0.85rem", marginBottom: "0.6rem" }}>{erroLogo}</p>}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => salvarLogo(logoUrl)}
            disabled={salvandoLogo || !logoUrl}
          >
            {salvandoLogo ? "Salvando..." : "Salvar logo"}
          </button>
          {logoUrl && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setLogoUrl("");
                salvarLogo("");
              }}
              disabled={salvandoLogo}
            >
              Usar logo padrão
            </button>
          )}
        </div>
      </div>

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
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          As mensagens automáticas são verificadas uma vez por dia, às 09h (horário de Brasília).
          Horário configurável exige o plano Pro da Vercel.
        </p>
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar configurações"}
        </button>
        {salvo && <p style={{ color: "var(--sage)", fontSize: "0.85rem" }}>Configurações salvas.</p>}
      </form>
    </div>
  );
}
