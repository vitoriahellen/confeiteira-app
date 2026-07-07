"use client";

import { useState } from "react";

export default function ClienteForm({ inicial, onSubmit, enviando, textoBotao }) {
  const [form, setForm] = useState({
    nome: inicial?.nome || "",
    telefone: inicial?.telefone || "",
    endereco: inicial?.endereco || "",
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
        <label className="label">Nome da cliente</label>
        <input className="input" required value={form.nome} onChange={(e) => campo("nome", e.target.value)} />
      </div>

      <div>
        <label className="label">WhatsApp (com DDD)</label>
        <input
          className="input"
          placeholder="Ex: 19999999999"
          value={form.telefone}
          onChange={(e) => campo("telefone", e.target.value)}
        />
      </div>

      <div>
        <label className="label">Endereço de entrega</label>
        <textarea
          className="input"
          rows={3}
          value={form.endereco}
          onChange={(e) => campo("endereco", e.target.value)}
          placeholder="Rua, número, bairro, cidade..."
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {enviando ? "Salvando..." : textoBotao || "Salvar"}
      </button>
    </form>
  );
}
