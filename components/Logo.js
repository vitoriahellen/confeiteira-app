function Cupcake({ size = 18 }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      🧁
    </span>
  );
}

/**
 * variant "sidebar" — lockup compacto para o topo do menu.
 * variant "stacked" — lockup grande para telas de login/setup.
 * Quando `logoUrl` é informado (logo personalizada pela cliente), mostra
 * só a imagem, sem legenda.
 */
export default function Logo({ variant = "sidebar", logoUrl }) {
  if (logoUrl) {
    if (variant === "stacked") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Logo"
          style={{ display: "block", width: "auto", height: "auto", maxWidth: 320, maxHeight: 220, objectFit: "contain" }}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt="Logo"
        style={{ display: "block", width: "auto", height: "auto", maxWidth: "100%", maxHeight: 76, objectFit: "contain" }}
      />
    );
  }

  if (variant === "stacked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--brand)",
            color: "#fff",
            borderRadius: 20,
            padding: "1.4rem 2.2rem",
          }}
        >
          <Cupcake size={32} />
          <span style={{ fontFamily: "var(--font-script)", fontSize: "2.3rem", lineHeight: 1 }}>
            Doce Gestão
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0 }}>
          sistema para confeiteiras
        </p>
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
        <Cupcake size={17} />
      </div>
      <div style={{ lineHeight: 1.05 }}>
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontWeight: 700,
            fontSize: "1.3rem",
            margin: 0,
            color: "var(--brand)",
          }}
        >
          Doce Gestão
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: 0 }}>
          sistema para confeiteiras
        </p>
      </div>
    </div>
  );
}
