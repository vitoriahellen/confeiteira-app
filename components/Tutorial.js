"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

const PASSOS = [
  {
    titulo: "Bem-vinda ao Doce Gestão! 🍰",
    texto:
      "Esse é um tour rápido pra você conhecer as principais partes do sistema. Pode pular a qualquer momento e rever depois em Configurações → Parâmetros → \"Rever tutorial\".",
  },
  {
    titulo: "📅 Agenda",
    texto:
      "É a tela inicial. Mostra o calendário da semana ou do mês com todos os pedidos, coloridos pelo status. Clique em um dia pra ver os detalhes.",
  },
  {
    titulo: "🧁 Pedidos",
    texto:
      "Cadastre encomendas, acompanhe pelo quadro Kanban (arraste entre as colunas) ou veja em lista. Cada pedido guarda cliente, itens do catálogo, valores, sinal e data de entrega.",
  },
  {
    titulo: "🎂 Produtos",
    texto: "Seu catálogo de produtos (nome, unidade, preço padrão) — usado para montar pedidos rapidinho, sem digitar tudo de novo.",
  },
  {
    titulo: "📇 Clientes",
    texto: "Cadastro de clientes com WhatsApp e endereço de entrega, reaproveitado automaticamente nos pedidos.",
  },
  {
    titulo: "💰 Financeiro",
    texto: "Visão geral do que já recebeu e do que ainda tem a receber, com filtro por período e status.",
  },
  {
    titulo: "📨 Mensageria",
    texto:
      "Lembretes automáticos de cobrança (sinal/restante) e de entrega, por WhatsApp. Você também pode disparar manualmente com o botão \"Notificar agora\".",
  },
  {
    titulo: "⚙️ Configurações",
    texto:
      "(Só administradoras) Personalize mensagens, logo, permissões de cada usuária e acompanhe os logs de atividade do sistema.",
  },
];

export default function Tutorial({ onFechar }) {
  const [passo, setPasso] = useState(0);
  const ultimo = passo === PASSOS.length - 1;
  const atual = PASSOS[passo];

  return (
    <Modal titulo={atual.titulo} onClose={onFechar}>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "1.4rem" }}>
        {atual.texto}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
        <button type="button" className="btn btn-outline" onClick={onFechar} style={{ fontSize: "0.82rem" }}>
          Pular
        </button>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {passo > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setPasso((p) => p - 1)}>
              Anterior
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (ultimo ? onFechar() : setPasso((p) => p + 1))}
          >
            {ultimo ? "Concluir" : "Próximo"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.3rem", marginTop: "1.2rem" }}>
        {PASSOS.map((_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i === passo ? "var(--accent)" : "var(--card-border)",
            }}
          />
        ))}
      </div>
    </Modal>
  );
}
