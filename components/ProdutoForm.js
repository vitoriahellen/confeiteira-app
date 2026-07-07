"use client";

import { useState } from "react";

const UNIDADES = ["Un", "Kg", "g", "Cento", "Dúzia", "Fatia", "Pacote", "Caixa"];

export default function ProdutoForm({ inicial, onSubmit, enviando, textoBotao }) {
  const [form, setForm] = useState({
    nome: inicial?.nome || "",
    unidade: inicial?.unidade || "Un",
    descricao: inicial?.descricao || "",
    preco_padrao: inicial?.preco_padrao ?? "",
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
      style={{ padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 560 }}
    >
      <div>
        <label className="label">Nome do produto</label>
        <input className="input" required value={form.nome} onChange={(e) => campo("nome", e.target.value)} />
      </div>

      <div className="grid-2">
        <div>
          <label className="label">Unidade de medida</label>
          <select className="input" value={form.unidade} onChange={(e) => campo("unidade", e.target.value)}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Preço padrão (R$)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.preco_padrao}
            onChange={(e) => campo("preco_padrao", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea
          className="input"
          rows={3}
          value={form.descricao}
          onChange={(e) => campo("descricao", e.target.value)}
          placeholder="Ex: Massa de chocolate com recheio de brigadeiro..."
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? "Salvando..." : textoBotao || "Salvar"}
      </button>
    </form>
  );
}
