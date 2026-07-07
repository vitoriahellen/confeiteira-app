"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível entrar.");
        setEnviando(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.6rem",
        padding: "1.5rem",
      }}
    >
      <Logo variant="stacked" />
      <form onSubmit={handleSubmit} className="card" style={{ padding: "2.2rem", width: 380 }}>
        <h1 className="display" style={{ fontSize: "1.6rem", marginBottom: "1.4rem" }}>
          Entrar
        </h1>

        <div style={{ marginBottom: "0.9rem" }}>
          <label className="label">E-mail</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label className="label">Senha</label>
          <input
            className="input"
            type="password"
            required
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />
        </div>

        {erro && (
          <p style={{ color: "#b23b3b", fontSize: "0.85rem", marginBottom: "1rem" }}>{erro}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
