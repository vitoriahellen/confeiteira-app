"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import ClienteForm from "@/components/ClienteForm";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_producao", label: "Em produção" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

export default function PedidoForm({ inicial, onSubmit, enviando, textoBotao }) {
  const [form, setForm] = useState({
    cliente_nome: inicial?.cliente_nome || "",
    cliente_telefone: inicial?.cliente_telefone || "",
    itens: inicial?.itens || "",
    valor_total: inicial?.valor_total ?? "",
    valor_sinal: inicial?.valor_sinal ?? "",
    sinal_pago: inicial?.sinal_pago ?? false,
    restante_pago: inicial?.restante_pago ?? false,
    desconto: inicial?.desconto ?? "0",
    acrescimo: inicial?.acrescimo ?? "0",
    data_entrega: inicial?.data_entrega?.slice(0, 10) || "",
    data_vencimento_sinal: inicial?.data_vencimento_sinal?.slice(0, 10) || "",
    data_vencimento_restante: inicial?.data_vencimento_restante?.slice(0, 10) || "",
    status: inicial?.status || "novo",
    observacoes: inicial?.observacoes || "",
  });

  // --- cliente cadastrado ---
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState(inicial?.cliente_nome || "");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [enviandoCliente, setEnviandoCliente] = useState(false);
  const [erroCliente, setErroCliente] = useState("");

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((data) => setClientes(data.clientes || []))
      .catch(() => {});
  }, []);

  const sugestoesCliente = buscaCliente.trim()
    ? clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.trim().toLowerCase()))
    : clientes;

  function selecionarCliente(c) {
    setBuscaCliente(c.nome);
    campo("cliente_nome", c.nome);
    campo("cliente_telefone", c.telefone || "");
    setMostrarSugestoes(false);
  }

  async function criarClienteRapido(dadosCliente) {
    setEnviandoCliente(true);
    setErroCliente("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCliente),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroCliente(data.error || "Não foi possível criar a cliente.");
        setEnviandoCliente(false);
        return;
      }
      setClientes((atual) => [...atual, data.cliente]);
      selecionarCliente(data.cliente);
      setEnviandoCliente(false);
      setModalClienteAberto(false);
    } catch {
      setErroCliente("Erro de conexão.");
      setEnviandoCliente(false);
    }
  }

  // --- produtos do catálogo ---
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [qtdProduto, setQtdProduto] = useState("1");

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data) => setProdutos(data.produtos || []))
      .catch(() => {});
  }, []);

  function adicionarProdutoDoCatalogo() {
    const produto = produtos.find((p) => String(p.id) === produtoSelecionado);
    if (!produto) return;
    const qtd = Number(qtdProduto) || 1;
    const totalLinha = qtd * Number(produto.preco_padrao);
    const linhaTexto = `${qtd}x ${produto.nome} (R$ ${totalLinha.toFixed(2)})`;
    setForm((f) => ({
      ...f,
      itens: f.itens ? `${f.itens}\n${linhaTexto}` : linhaTexto,
      valor_total: (Number(f.valor_total) || 0) + totalLinha,
    }));
    setProdutoSelecionado("");
    setQtdProduto("1");
  }

  function alterarDesconto(novoValor) {
    const delta = (Number(form.desconto) || 0) - (Number(novoValor) || 0);
    setForm((f) => ({ ...f, desconto: novoValor, valor_total: (Number(f.valor_total) || 0) + delta }));
  }

  function alterarAcrescimo(novoValor) {
    const delta = (Number(novoValor) || 0) - (Number(form.acrescimo) || 0);
    setForm((f) => ({ ...f, acrescimo: novoValor, valor_total: (Number(f.valor_total) || 0) + delta }));
  }

  function campo(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="card"
      style={{ padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}
    >
      <div style={{ position: "relative" }}>
        <label className="label">Cliente</label>
        <input
          className="input"
          required
          value={buscaCliente}
          onChange={(e) => {
            setBuscaCliente(e.target.value);
            campo("cliente_nome", e.target.value);
            setMostrarSugestoes(true);
          }}
          onFocus={() => setMostrarSugestoes(true)}
          onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
          placeholder="Busque uma cliente cadastrada..."
        />
        {mostrarSugestoes && (
          <div
            className="card"
            style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 10, maxHeight: 220, overflowY: "auto", padding: "0.4rem" }}
          >
            {sugestoesCliente.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selecionarCliente(c)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.6rem", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <strong>{c.nome}</strong>
                {c.telefone && <span style={{ color: "var(--ink-soft)", marginLeft: "0.4rem" }}>· {c.telefone}</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setModalClienteAberto(true)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.6rem", borderRadius: 8, border: "none", background: "transparent", color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              + Incluir cliente{buscaCliente.trim() ? ` "${buscaCliente.trim()}"` : ""}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="label">WhatsApp da cliente (com DDD)</label>
        <input
          className="input"
          placeholder="Ex: 19999999999"
          value={form.cliente_telefone}
          onChange={(e) => campo("cliente_telefone", e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: "0.9rem", background: "var(--brand-soft)", border: "none", display: "flex", gap: "0.6rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="label">Adicionar produto do catálogo</label>
          <select className="input" value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}>
            <option value="">Selecione um produto...</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco_padrao).toFixed(2)} / {p.unidade}</option>
            ))}
          </select>
        </div>
        <div style={{ width: 90 }}>
          <label className="label">Qtd.</label>
          <input className="input" type="number" min="1" step="1" value={qtdProduto} onChange={(e) => setQtdProduto(e.target.value)} />
        </div>
        <button type="button" className="btn btn-outline" onClick={adicionarProdutoDoCatalogo} disabled={!produtoSelecionado}>
          + Adicionar
        </button>
      </div>

      <div>
        <label className="label">Itens do pedido</label>
        <textarea
          className="input"
          required
          rows={3}
          value={form.itens}
          onChange={(e) => campo("itens", e.target.value)}
          placeholder="Ex: Bolo de chocolate 2kg + 30 docinhos"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label">Valor total (R$)</label>
          <input className="input" type="number" step="0.01" min="0" required value={form.valor_total} onChange={(e) => campo("valor_total", e.target.value)} />
        </div>
        <div>
          <label className="label">Valor do sinal (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.valor_sinal} onChange={(e) => campo("valor_sinal", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label">Desconto (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.desconto} onChange={(e) => alterarDesconto(e.target.value)} />
        </div>
        <div>
          <label className="label">Acréscimo (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.acrescimo} onChange={(e) => alterarAcrescimo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label">Data de entrega</label>
          <input className="input" type="date" required value={form.data_entrega} onChange={(e) => campo("data_entrega", e.target.value)} />
        </div>
        <div>
          <label className="label">Vencimento do sinal</label>
          <input className="input" type="date" value={form.data_vencimento_sinal} onChange={(e) => campo("data_vencimento_sinal", e.target.value)} />
        </div>
        <div>
          <label className="label">Vencimento do restante</label>
          <input className="input" type="date" value={form.data_vencimento_restante} onChange={(e) => campo("data_vencimento_restante", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.6rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
          <input type="checkbox" checked={form.sinal_pago} onChange={(e) => campo("sinal_pago", e.target.checked)} />
          Sinal pago
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
          <input type="checkbox" checked={form.restante_pago} onChange={(e) => campo("restante_pago", e.target.checked)} />
          Restante pago
        </label>
      </div>

      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => campo("status", e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea className="input" rows={2} value={form.observacoes} onChange={(e) => campo("observacoes", e.target.value)} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? "Salvando..." : textoBotao || "Salvar"}
      </button>
    </form>

    {modalClienteAberto && (
      <Modal titulo="Incluir cliente" onClose={() => setModalClienteAberto(false)}>
        {erroCliente && <p style={{ color: "#b23b3b", marginBottom: "0.8rem" }}>{erroCliente}</p>}
        <ClienteForm
          inicial={{ nome: buscaCliente }}
          onSubmit={criarClienteRapido}
          enviando={enviandoCliente}
          textoBotao="Adicionar cliente"
        />
      </Modal>
    )}
    </>
  );
}
