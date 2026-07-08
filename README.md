# Caderno — sistema de pedidos para confeiteiras

Sistema simples para substituir o caderno/WhatsApp na organização de encomendas:
- Cadastro de pedidos com itens, valores, status de pagamento e data de entrega
- Lembrete automático de pagamento (sinal e restante) por WhatsApp via Superchat
- Alerta automático de prazo de entrega
- Agenda em visão semana/mês
- Login com admin (você) que cadastra as demais usuárias da equipe

## Primeiro acesso

1. Acesse a URL do projeto — você será redirecionada para `/setup`.
2. Crie sua conta de administradora (nome, e-mail, senha).
3. Pronto: você já pode cadastrar pedidos e, em **Usuárias**, convidar mais pessoas.

## Variáveis de ambiente (configurar na Vercel → Settings → Environment Variables)

Veja `.env.example`. As principais:

- `DATABASE_URL` — preenchida automaticamente ao adicionar a integração **Postgres** (Neon)
  no projeto pela aba **Storage** da Vercel.
- `AUTH_SECRET` — qualquer string aleatória longa (ex: gere com `openssl rand -hex 32`).
- `SUPERCHAT_API_KEY` — gerada em app.superchat.com → Configurações → API. Sem essa
  variável, o sistema funciona normalmente, só não envia as mensagens de WhatsApp
  (fica registrado no log).
- `SUPERCHAT_CHANNEL_ID` — opcional. ID do canal de WhatsApp na Superchat; se omitido,
  o sistema descobre automaticamente o primeiro canal do tipo WhatsApp da conta.
- `SUPERCHAT_NUMERO_INTERNO` — número que deve receber o alerta interno de "faltam X dias
  para a entrega" (ex: o seu próprio WhatsApp).
- `SUPERCHAT_TEMPLATE_SINAL`, `SUPERCHAT_TEMPLATE_RESTANTE`, `SUPERCHAT_TEMPLATE_ENTREGA` —
  opcionais. Nomes dos Modelos de Mensagem (Templates) aprovados pela Meta no painel da
  Superchat, usados para iniciar conversa fora da janela de 24h do WhatsApp (sem eles, o
  envio só funciona se a cliente tiver escrito nas últimas 24h). Se não definidos, o
  sistema procura templates com os nomes `doce_gestao_sinal`, `doce_gestao_restante` e
  `doce_gestao_entrega`.
- `CRON_SECRET` — opcional, mas recomendado. Qualquer string aleatória. A Vercel
  automaticamente envia esse valor no header `Authorization: Bearer <CRON_SECRET>`
  quando dispara os crons.

## Lembretes automáticos

Dois cron jobs (configurados em `vercel.json`) rodam todo dia às 09:00 (horário de Brasília):

- `/api/cron/payment-reminders` — verifica pedidos com sinal ou restante perto do
  vencimento (conforme configurado em **Configurações**) e envia mensagem de cobrança
  para o WhatsApp da cliente.
- `/api/cron/delivery-alerts` — verifica pedidos com entrega próxima e envia um alerta
  interno para `SUPERCHAT_NUMERO_INTERNO`.

Os prazos (quantos dias de antecedência) são ajustáveis em **Configurações** dentro do sistema.

## Banco de dados

Não usa migrações separadas — as tabelas são criadas automaticamente (`CREATE TABLE IF NOT EXISTS`)
na primeira requisição à API. Não é necessário rodar nenhum comando manual.

## Stack

Next.js (App Router) + Postgres (`pg`) + JWT em cookie httpOnly (`jose`) + Tailwind.
