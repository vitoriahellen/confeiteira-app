"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { TEMPLATES_PADRAO, renderTemplate } from "@/lib/lembretes";

const ABAS = [
  { chave: "mensagens", label: "Mensagens" },
  { chave: "usuarios", label: "Usuários" },
  { chave: "parametros", label: "Parâmetros" },
  { chave: "logs", label: "Logs" },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState("mensagens");
  const [config, setConfig] = useState({
    dias_lembrete_pagamento: "2",
    dias_alerta_entrega: "3",
    ...TEMPLATES_PADRAO,
  });
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
        if (data.config) setConfig((atual) => ({ ...atual, ...data.config }));
        setLogoUrl(data.config?.logo_url || "");
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
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.2rem" }}>Aparência e lembretes</h1>

      <div className="card" style={{ display: "flex", padding: 4, marginBottom: "1.4rem", flexWrap: "wrap", width: "fit-content" }}>
        {ABAS.map((item) => (
          <button
            key={item.chave}
            onClick={() => setAba(item.chave)}
            className="btn"
            style={{
              background: aba === item.chave ? "var(--accent)" : "transparent",
              color: aba === item.chave ? "#fff" : "var(--ink-soft)",
              padding: "0.4rem 0.9rem",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {aba === "mensagens" && (
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

          <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: "0.2rem 0" }} />

          <h3 className="display" style={{ fontSize: "1.05rem", margin: 0 }}>Personalizar mensagens</h3>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "-0.6rem" }}>
            Use <code className="mono">{"{{nomedocliente}}"}</code>, <code className="mono">{"{{valor}}"}</code>,{" "}
            <code className="mono">{"{{itens}}"}</code> e <code className="mono">{"{{data}}"}</code> onde quiser — o
            sistema substitui pelos dados de cada pedido.
          </p>

          <CampoMensagem
            label="Cobrança do sinal"
            value={config.mensagem_sinal}
            onChange={(v) => setConfig({ ...config, mensagem_sinal: v })}
            exemplo={{ nomedocliente: "Ana", valor: "29,95", itens: "1x Bolo Decorado", data: "09/07/2026" }}
          />
          <CampoMensagem
            label="Cobrança do restante"
            value={config.mensagem_restante}
            onChange={(v) => setConfig({ ...config, mensagem_restante: v })}
            exemplo={{ nomedocliente: "Ana", valor: "29,95", itens: "1x Bolo Decorado", data: "09/07/2026" }}
          />
          <CampoMensagem
            label="Alerta de entrega (mensagem interna, enviada pro seu WhatsApp)"
            value={config.mensagem_entrega}
            onChange={(v) => setConfig({ ...config, mensagem_entrega: v })}
            exemplo={{ nomedocliente: "Ana", itens: "1x Bolo Decorado", data: "14/07/2026", dias: "3" }}
          />

          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar configurações"}
          </button>
          {salvo && <p style={{ color: "var(--sage)", fontSize: "0.85rem" }}>Configurações salvas.</p>}
        </form>
      )}

      {aba === "usuarios" && <AbaUsuarios />}

      {aba === "parametros" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", maxWidth: 560 }}>
          <div className="card" style={{ padding: "1.4rem" }}>
            <h3 className="display" style={{ fontSize: "1.05rem", margin: "0 0 0.9rem" }}>Logo do sistema</h3>
            <div style={{ marginBottom: "1rem" }}>
              <Logo variant="sidebar" logoUrl={logoUrl} />
            </div>
            <label className="label">Enviar uma imagem (até 1MB)</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
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

          <CardMensageria />

          <div className="card" style={{ padding: "1.4rem" }}>
            <h3 className="display" style={{ fontSize: "1.05rem", margin: "0 0 0.6rem" }}>Tutorial</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: "0.8rem" }}>
              Reabra o passo a passo de apresentação do sistema quando quiser.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.dispatchEvent(new Event("abrir-tutorial"))}
            >
              Rever tutorial
            </button>
          </div>
        </div>
      )}

      {aba === "logs" && <AbaLogs />}
    </div>
  );
}

function CampoMensagem({ label, value, onChange, exemplo }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.3rem" }}>
        Prévia: <em>{renderTemplate(value, exemplo)}</em>
      </p>
    </div>
  );
}

const PROVEDORES = [
  { chave: "superchat", label: "Superchat" },
  { chave: "zapi", label: "Z-API" },
];

function CardMensageria() {
  const [provedor, setProvedor] = useState("superchat");
  const [superchat, setSuperchat] = useState({
    apiKey: "",
    apiKeyDefinida: false,
    channelId: "",
    numeroInterno: "",
    templateSinal: "",
    templateRestante: "",
    templateEntrega: "",
  });
  const [zapi, setZapi] = useState({
    instanceId: "",
    token: "",
    tokenDefinido: false,
    clientToken: "",
    clientTokenDefinido: false,
    numeroInterno: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/mensageria/config")
      .then((r) => r.json())
      .then((data) => {
        setProvedor(data.provedor || "superchat");
        setSuperchat((atual) => ({ ...atual, ...data.superchat, apiKey: "" }));
        setZapi((atual) => ({ ...atual, ...data.zapi, token: "", clientToken: "" }));
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/mensageria/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provedor, superchat, zapi }),
    });
    setSuperchat((atual) => ({ ...atual, apiKey: "" }));
    setZapi((atual) => ({ ...atual, token: "", clientToken: "" }));
    setSalvando(false);
    setSalvo(true);
  }

  if (carregando) {
    return (
      <div className="card" style={{ padding: "1.4rem" }}>
        <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.4rem" }}>
      <h3 className="display" style={{ fontSize: "1.05rem", margin: "0 0 0.9rem" }}>Mensageria (WhatsApp)</h3>

      <div style={{ display: "flex", border: "1px solid var(--card-border)", borderRadius: 999, padding: 4, marginBottom: "1rem", width: "fit-content" }}>
        {PROVEDORES.map((p) => (
          <button
            key={p.chave}
            type="button"
            onClick={() => setProvedor(p.chave)}
            className="btn"
            style={{
              background: provedor === p.chave ? "var(--accent)" : "transparent",
              color: provedor === p.chave ? "#fff" : "var(--ink-soft)",
              padding: "0.4rem 0.9rem",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {provedor === "superchat" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div>
            <label className="label">API Key</label>
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder={superchat.apiKeyDefinida ? "•••••••• (definida — deixe em branco pra manter)" : "Cole o token da Superchat"}
              value={superchat.apiKey}
              onChange={(e) => setSuperchat({ ...superchat, apiKey: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Channel ID (opcional)</label>
            <input
              className="input"
              value={superchat.channelId}
              onChange={(e) => setSuperchat({ ...superchat, channelId: e.target.value })}
              placeholder="Descoberto automaticamente se vazio"
            />
          </div>
          <div>
            <label className="label">Número interno (alertas de entrega)</label>
            <input
              className="input"
              value={superchat.numeroInterno}
              onChange={(e) => setSuperchat({ ...superchat, numeroInterno: e.target.value })}
              placeholder="Ex: 5519999999999"
            />
          </div>
          <details>
            <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Nomes dos templates aprovados (opcional)
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.6rem" }}>
              <input className="input" value={superchat.templateSinal} onChange={(e) => setSuperchat({ ...superchat, templateSinal: e.target.value })} placeholder="doce_gestao_sinal" />
              <input className="input" value={superchat.templateRestante} onChange={(e) => setSuperchat({ ...superchat, templateRestante: e.target.value })} placeholder="doce_gestao_restante" />
              <input className="input" value={superchat.templateEntrega} onChange={(e) => setSuperchat({ ...superchat, templateEntrega: e.target.value })} placeholder="doce_gestao_entrega" />
            </div>
          </details>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div>
            <label className="label">Instance ID</label>
            <input className="input" value={zapi.instanceId} onChange={(e) => setZapi({ ...zapi, instanceId: e.target.value })} />
          </div>
          <div>
            <label className="label">Token</label>
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder={zapi.tokenDefinido ? "•••••••• (definido — deixe em branco pra manter)" : "Token da instância"}
              value={zapi.token}
              onChange={(e) => setZapi({ ...zapi, token: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Client-Token (segurança da conta)</label>
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder={zapi.clientTokenDefinido ? "•••••••• (definido — deixe em branco pra manter)" : "Opcional"}
              value={zapi.clientToken}
              onChange={(e) => setZapi({ ...zapi, clientToken: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Número interno (alertas de entrega)</label>
            <input
              className="input"
              value={zapi.numeroInterno}
              onChange={(e) => setZapi({ ...zapi, numeroInterno: e.target.value })}
              placeholder="Ex: 5519999999999"
            />
          </div>
        </div>
      )}

      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.8rem" }}>
        Os tokens ficam salvos criptografados no banco de dados — depois de salvos, não são mostrados de novo
        (deixe o campo em branco para manter o valor já salvo).
      </p>

      <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ marginTop: "0.8rem" }}>
        {salvando ? "Salvando..." : "Salvar mensageria"}
      </button>
      {salvo && <p style={{ color: "var(--sage)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Configuração salva.</p>}
    </div>
  );
}

const MODULOS_PERMISSAO = [
  { chave: "pedidos", label: "Pedidos" },
  { chave: "produtos", label: "Produtos" },
  { chave: "clientes", label: "Clientes" },
  { chave: "financeiro", label: "Financeiro" },
  { chave: "mensageria", label: "Mensageria" },
];

function AbaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => {
        setUsuarios(data.usuarios || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  async function alternarModulo(usuario, modulo) {
    const atual = usuario.permissoes || [];
    const novo = atual.includes(modulo) ? atual.filter((m) => m !== modulo) : [...atual, modulo];
    setSalvandoId(usuario.id);
    setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, permissoes: novo } : u)));
    try {
      await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissoes: novo }),
      });
    } finally {
      setSalvandoId(null);
    }
  }

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;

  return (
    <div className="card" style={{ padding: "1.4rem", maxWidth: 720, overflowX: "auto" }}>
      <h3 className="display" style={{ fontSize: "1.05rem", margin: "0 0 0.4rem" }}>Permissões por módulo</h3>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
        Escolha quais partes do sistema cada usuária pode acessar. Administradoras sempre têm acesso a
        tudo. Para convidar ou remover usuárias, use a página <strong>Usuárias</strong> no menu.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--card-border)" }}>
            <th style={{ padding: "0.5rem" }}>Usuária</th>
            {MODULOS_PERMISSAO.map((m) => (
              <th key={m.chave} style={{ padding: "0.5rem", textAlign: "center" }}>{m.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
              <td style={{ padding: "0.5rem" }}>
                <strong>{u.nome}</strong>
                <div style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>
                  {u.papel === "admin" ? "Administradora" : "Membro"}
                </div>
              </td>
              {MODULOS_PERMISSAO.map((m) => (
                <td key={m.chave} style={{ padding: "0.5rem", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={u.papel === "admin" || (u.permissoes || []).includes(m.chave)}
                    disabled={u.papel === "admin" || salvandoId === u.id}
                    onChange={() => alternarModulo(u, m.chave)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TIPO_LABEL = {
  login_sucesso: { texto: "Login", cor: "var(--sage)" },
  login_falha: { texto: "Falha de login", cor: "#b23b3b" },
  criacao: { texto: "Criação", cor: "var(--purple)" },
  edicao: { texto: "Edição", cor: "var(--honey)" },
  exclusao: { texto: "Exclusão", cor: "#b23b3b" },
  erro: { texto: "Erro", cor: "#b23b3b" },
};

function AbaLogs() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    fetch("/api/auditoria")
      .then((r) => r.json())
      .then((data) => {
        setEventos(data.eventos || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }, []);

  const filtrados = filtroTipo ? eventos.filter((e) => e.tipo === filtroTipo) : eventos;

  if (carregando) return <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>;

  return (
    <div className="card" style={{ padding: "1.4rem", overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.6rem" }}>
        <h3 className="display" style={{ fontSize: "1.05rem", margin: 0 }}>Logs de atividade</h3>
        <select className="input" style={{ width: "auto" }} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([chave, { texto }]) => (
            <option key={chave} value={chave}>{texto}</option>
          ))}
        </select>
      </div>
      {filtrados.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>Nenhum evento registrado.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--card-border)" }}>
              <th style={{ padding: "0.5rem" }}>Data/hora</th>
              <th style={{ padding: "0.5rem" }}>Usuária</th>
              <th style={{ padding: "0.5rem" }}>Tipo</th>
              <th style={{ padding: "0.5rem" }}>Módulo</th>
              <th style={{ padding: "0.5rem" }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((ev) => {
              const rotulo = TIPO_LABEL[ev.tipo] || { texto: ev.tipo, cor: "var(--ink-soft)" };
              return (
                <tr key={ev.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                    {new Date(ev.criado_em).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{ev.usuario_nome || "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span
                      className="badge"
                      style={{ background: "var(--card)", border: `1px solid ${rotulo.cor}`, color: rotulo.cor }}
                    >
                      {rotulo.texto}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{ev.modulo || "—"}</td>
                  <td style={{ padding: "0.5rem" }}>{ev.detalhes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
