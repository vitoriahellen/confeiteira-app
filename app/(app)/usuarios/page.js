"use client";

import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", telefone: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    setCarregando(true);
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => {
        setUsuarios(data.usuarios || []);
        setCarregando(false);
      })
      .catch(() => setCarregando(false));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível criar a usuária.");
        setEnviando(false);
        return;
      }
      setForm({ nome: "", email: "", senha: "", telefone: "" });
      setEnviando(false);
      carregar();
    } catch {
      setErro("Erro de conexão.");
      setEnviando(false);
    }
  }

  async function remover(id) {
    if (!confirm("Remover esta usuária do sistema?")) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (res.ok) carregar();
    else {
      const data = await res.json();
      alert(data.error || "Não foi possível remover.");
    }
  }

  return (
    <div>
      <p className="label" style={{ color: "var(--accent)" }}>Equipe</p>
      <h1 className="display" style={{ fontSize: "1.8rem", marginBottom: "1.4rem" }}>Usuárias do sistema</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "1.6rem", alignItems: "start" }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: "1.6rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <h3 className="display" style={{ fontSize: "1.1rem", margin: 0 }}>Adicionar usuária</h3>
          <div>
            <label className="label">Nome</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Telefone (opcional)</label>
            <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label className="label">Senha provisória</label>
            <input className="input" type="password" required minLength={6} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
          </div>
          {erro && <p style={{ color: "#b23b3b", fontSize: "0.85rem" }}>{erro}</p>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? "Adicionando..." : "Adicionar usuária"}
          </button>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            Ela poderá criar e editar pedidos, mas não gerenciar outras usuárias.
          </p>
        </form>

        <div>
          {carregando ? (
            <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {usuarios.map((u) => (
                <div key={u.id} className="card" style={{ padding: "0.9rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{u.nome}</strong>{" "}
                    <span className="badge" style={{ background: u.papel === "admin" ? "#f1e6f6" : "var(--sage-bg)", color: u.papel === "admin" ? "#7a4fa0" : "var(--sage)" }}>
                      {u.papel === "admin" ? "Admin" : "Membro"}
                    </span>
                    <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{u.email}</div>
                  </div>
                  {u.papel !== "admin" && (
                    <button onClick={() => remover(u.id)} className="btn btn-danger">Remover</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
