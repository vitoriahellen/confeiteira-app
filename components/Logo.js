function Heart({ size = 12, color = "var(--accent)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10.2-9.1C.2 9 1 5.4 4.2 4.1 6.6 3.1 9.2 4 12 7c2.8-3 5.4-3.9 7.8-2.9 3.2 1.3 4 4.9 2.4 7.8C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

/**
 * variant "sidebar" — lockup compacto para o topo do menu.
 * variant "stacked" — lockup grande para telas de login/setup, no estilo do
 * cartão de marca (badge escuro + "Casa" script + "do Bolo" em serifa).
 */
export default function Logo({ variant = "sidebar" }) {
  if (variant === "stacked") {
    return (
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.2rem",
          background: "var(--brand)",
          color: "#fff",
          borderRadius: 20,
          padding: "1.6rem 2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "2rem",
              lineHeight: 1,
            }}
          >
            Casa
          </span>
          <Heart size={14} color="#e7a9c1" />
        </div>
        <div style={{ textAlign: "center", lineHeight: 0.85 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-script)",
              fontSize: "1rem",
              marginBottom: "-0.2rem",
            }}
          >
            do
          </span>
          <span
            className="display"
            style={{ color: "#fff", fontSize: "2.4rem", fontWeight: 700 }}
          >
            Bolo
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Heart size={15} color="#f3b6cd" />
      </div>
      <div style={{ lineHeight: 1.05 }}>
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontWeight: 700,
            fontSize: "1.35rem",
            margin: 0,
            color: "var(--brand)",
          }}
        >
          Casa do Bolo
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: 0 }}>
          gestão de encomendas
        </p>
      </div>
    </div>
  );
}
