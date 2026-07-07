"use client";

import { useState } from "react";

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
    data_entrega: inicial?.data_entrega?.slice(0, 10) || "",
    data_vencimento_sinal: inicial?.data_vencimento_sinal?.slice(0, 10) || "",
    data_vencimento_restante: inicial?.data_vencimento_restante?.slice(0, 10) || "",
    status: inicial?.status || "novo",
    observacoes: inicial?.observacoes || "",
  });

  function campo(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="card"
      style={{ padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}
    >
      <div>
        <label className="label">Nome da cliente</label>
        <input className="input" required value={form.cliente_nome} onChange={(e) => campo("cliente_nome", e.target.value)} />
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
  );
}
