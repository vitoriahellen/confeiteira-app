"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function SetupPage() {
  const router = useRouter();
  const [checando, setChecando] = useState(true);
  const [jaConfigurado, setJaConfigurado] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data) => {
        setJaConfigurado(Boolean(data.jaConfigurado));
        setChecando(false);
      })
      .catch(() => setChecando(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível criar o administrador.");
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

  if (checando) {
    return <CentroCarregando />;
  }

  if (jaConfigurado) {
    return (
      <Centro>
        <Logo variant="stacked" />
        <div className="card" style={{ padding: "2rem", maxWidth: 420, textAlign: "center" }}>
          <h1 className="display" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
            Já existe um administrador
          </h1>
          <p style={{ color: "var(--ink-soft)", marginBottom: "1.2rem" }}>
            O sistema já foi configurado. Faça login para continuar.
          </p>
          <a href="/login" className="btn btn-primary" style={{ display: "inline-flex" }}>
            Ir para o login
          </a>
        </div>
        <Footer />
      </Centro>
    );
  }

  return (
    <Centro>
      <Logo variant="stacked" />
      <form onSubmit={handleSubmit} className="card" style={{ padding: "2.2rem", width: 400 }}>
        <p className="label" style={{ color: "var(--accent)" }}>Configuração inicial</p>
        <h1 className="display" style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
          Crie sua conta de administradora
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
          Você será a primeira usuária do sistema e poderá convidar mais pessoas depois.
        </p>

        <div style={{ marginBottom: "0.9rem" }}>
          <label className="label">Seu nome</label>
          <input
            className="input"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: Vitória Hellen"
          />
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label className="label">E-mail</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@exemplo.com"
          />
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label className="label">Senha</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {erro && (
          <p style={{ color: "#b23b3b", fontSize: "0.85rem", marginBottom: "1rem" }}>{erro}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={enviando}>
          {enviando ? "Criando..." : "Criar administrador"}
        </button>
      </form>
      <Footer />
    </Centro>
  );
}

function Centro({ children }) {
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
      {children}
    </div>
  );
}

function CentroCarregando() {
  return (
    <Centro>
      <p style={{ color: "var(--ink-soft)" }}>Carregando...</p>
    </Centro>
  );
}
