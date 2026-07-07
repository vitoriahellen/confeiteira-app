export default function CartaoKpi({ icone, cor, corIcone, label, valor }) {
  return (
    <div className="card" style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: cor,
          color: corIcone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.15rem",
          flexShrink: 0,
        }}
      >
        {icone}
      </div>
      <div>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>{label}</p>
        <p className="display" style={{ fontSize: "1.25rem", margin: 0 }}>{valor}</p>
      </div>
    </div>
  );
}
