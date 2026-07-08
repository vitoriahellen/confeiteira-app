function IconeLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="62" height="50" rx="9" fill="#fffaf6" stroke="var(--brand)" strokeWidth="2.4" />
      <circle cx="12" cy="18" r="1.6" fill="var(--accent)" />
      <circle cx="18" cy="18" r="1.6" fill="var(--accent)" />
      <circle cx="24" cy="18" r="1.6" fill="var(--accent)" />
      <line x1="4" y1="25" x2="66" y2="25" stroke="#f0d8e0" strokeWidth="1.5" />

      <rect x="10" y="30" width="10" height="10" rx="2.5" fill="var(--brand)" />
      <path d="M12.5 35l1.8 1.8 3.2-3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="24" y="33" width="32" height="3" rx="1.5" fill="#e9d3da" />

      <rect x="10" y="43" width="10" height="10" rx="2.5" fill="var(--accent)" />
      <path d="M12.5 48l1.8 1.8 3.2-3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="24" y="46" width="26" height="3" rx="1.5" fill="#e9d3da" />

      <rect x="10" y="56" width="10" height="10" rx="2.5" fill="var(--accent-dark)" />
      <path d="M12.5 61l1.8 1.8 3.2-3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="24" y="59" width="20" height="3" rx="1.5" fill="#e9d3da" />

      <ellipse cx="75" cy="90" rx="17" ry="3.2" fill="var(--brand)" opacity="0.12" />

      <path d="M60 62 L91 62 L86 87 Q75.5 92 65 87 Z" fill="#f6ddb9" stroke="var(--brand)" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="67" y1="65" x2="70" y2="85" stroke="var(--brand)" strokeWidth="1" opacity="0.35" />
      <line x1="75.5" y1="65" x2="75.5" y2="88" stroke="var(--brand)" strokeWidth="1" opacity="0.35" />
      <line x1="84" y1="65" x2="81" y2="85" stroke="var(--brand)" strokeWidth="1" opacity="0.35" />

      <ellipse cx="72" cy="53" rx="15" ry="9" fill="#f6a8c6" opacity="0.55" />
      <circle cx="66" cy="58" r="11" fill="var(--accent)" />
      <circle cx="77" cy="54" r="12" fill="var(--accent)" />
      <circle cx="86" cy="60" r="9.5" fill="var(--accent)" />

      <path
        d="M77 42c-3.2-3.6-6.4-6-6.4-9.2 0-2.4 2-4.2 4.4-4.2 1.6 0 3 .9 4 2.2 1-1.3 2.4-2.2 4-2.2 2.4 0 4.4 1.8 4.4 4.2 0 3.2-3.2 5.6-6.4 9.2Z"
        fill="var(--accent-dark)"
      />
    </svg>
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", maxWidth: "100%" }}>
        <IconeLogo size={88} />
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.8rem, 8vw, 2.4rem)", margin: "0.3rem 0 0", lineHeight: 1 }}>
          <span style={{ color: "var(--accent)" }}>Doce</span> <span style={{ color: "var(--brand)" }}>Gestão</span>
        </p>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--ink-soft)",
            margin: 0,
            textAlign: "center",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            lineHeight: 1.5,
          }}
        >
          Sistema de cobrança e gestão
          <br />
          para confeiteiras
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <IconeLogo size={36} />
      <div style={{ lineHeight: 1.05 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", margin: 0 }}>
          <span style={{ color: "var(--accent)" }}>Doce</span> <span style={{ color: "var(--brand)" }}>Gestão</span>
        </p>
        <p style={{ fontSize: "0.68rem", color: "var(--ink-soft)", margin: 0 }}>
          sistema para confeiteiras
        </p>
      </div>
    </div>
  );
}
