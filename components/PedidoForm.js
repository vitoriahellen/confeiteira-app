"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import ClienteForm from "@/components/ClienteForm";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_producao", label: "Em produção" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

function linhaTexto(item) {
  return item.legado ? item.nome : `${item.quantidade}x ${item.nome}`;
}

export default function PedidoForm({ inicial, onSubmit, enviando, textoBotao }) {
  const [form, setForm] = useState({
    cliente_nome: inicial?.cliente_nome || "",
    cliente_telefone: inicial?.cliente_telefone || "",
    itens: inicial?.itens || "",
    valor_total: inicial?.valor_total ?? "0",
    valor_sinal: inicial?.valor_sinal ?? "0",
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
  const [erroItens, setErroItens] = useState("");
  const [sinalEditadoManualmente, setSinalEditadoManualmente] = useState(Boolean(inicial));

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

  // --- carrinho de produtos do catálogo (substitui o texto livre de itens) ---
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [qtdProduto, setQtdProduto] = useState("1");
  const [itensCarrinho, setItensCarrinho] = useState(() => {
    if (!inicial?.itens) return [];
    const subtotalLegado =
      (Number(inicial.valor_total) || 0) + (Number(inicial.desconto) || 0) - (Number(inicial.acrescimo) || 0);
    return [{ id: "legado", nome: inicial.itens, quantidade: 1, precoUnitario: subtotalLegado, subtotal: subtotalLegado, legado: true }];
  });

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
    const precoUnitario = Number(produto.preco_padrao);
    setItensCarrinho((atual) => [
      ...atual,
      { id: `${produto.id}-${Date.now()}`, nome: produto.nome, quantidade: qtd, precoUnitario, subtotal: qtd * precoUnitario },
    ]);
    setErroItens("");
    setProdutoSelecionado("");
    setQtdProduto("1");
  }

  function removerItemCarrinho(id) {
    setItensCarrinho((atual) => atual.filter((i) => i.id !== id));
  }

  const subtotalCarrinho = useMemo(
    () => itensCarrinho.reduce((acc, i) => acc + i.subtotal, 0),
    [itensCarrinho]
  );

  const valorTotalComputado = useMemo(
    () => Math.max(0, subtotalCarrinho - (Number(form.desconto) || 0) + (Number(form.acrescimo) || 0)),
    [subtotalCarrinho, form.desconto, form.acrescimo]
  );

  // mantém itens (texto) e valor_total em sincronia com o carrinho e desconto/acréscimo
  useEffect(() => {
    const itensTexto = itensCarrinho.map(linhaTexto).join("\n");
    setForm((f) => ({ ...f, itens: itensTexto, valor_total: valorTotalComputado.toFixed(2) }));
  }, [itensCarrinho, valorTotalComputado]);

  // sinal sugerido em 50% do total, editável manualmente
  useEffect(() => {
    if (sinalEditadoManualmente) return;
    setForm((f) => ({ ...f, valor_sinal: (valorTotalComputado * 0.5).toFixed(2) }));
  }, [valorTotalComputado, sinalEditadoManualmente]);

  function campo(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (itensCarrinho.length === 0) {
      setErroItens("Adicione ao menos um produto do catálogo.");
      return;
    }
    onSubmit(form);
  }

  return (
    <>
    <form
      onSubmit={handleSubmit}
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
        {itensCarrinho.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: "0.3rem 0" }}>
            Nenhum item adicionado ainda. Escolha um produto do catálogo acima.
          </p>
        ) : (
          <div className="card" style={{ padding: "0.5rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {itensCarrinho.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem", padding: "0.3rem 0" }}>
                <span>{linhaTexto(item)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <span className="mono">R$ {item.subtotal.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removerItemCarrinho(item.id)}
                    aria-label="Remover item"
                    style={{ border: "none", background: "transparent", color: "#b23b3b", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {erroItens && <p style={{ color: "#b23b3b", fontSize: "0.85rem", marginTop: "0.4rem" }}>{erroItens}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label">Valor total (R$)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.valor_total}
            readOnly
            title="Calculado a partir dos itens, desconto e acréscimo"
            style={{ background: "#f5eef1", cursor: "not-allowed" }}
          />
        </div>
        <div>
          <label className="label">Valor do sinal (R$)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={form.valor_sinal}
            onChange={(e) => {
              setSinalEditadoManualmente(true);
              campo("valor_sinal", e.target.value);
            }}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>Sugerido: 50% do valor total.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label">Desconto (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.desconto} onChange={(e) => campo("desconto", e.target.value)} />
        </div>
        <div>
          <label className="label">Acréscimo (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.acrescimo} onChange={(e) => campo("acrescimo", e.target.value)} />
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
