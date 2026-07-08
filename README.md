# Caderno — sistema de pedidos para confeiteiras

Sistema simples para substituir o caderno/WhatsApp na organização de encomendas:
- Cadastro de pedidos com itens, valores, status de pagamento e data de entrega
- Lembrete automático de pagamento (sinal e restante) por WhatsApp via Superchat ou Z-API
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
  Também é usada para derivar a chave que criptografa os tokens de mensageria salvos no banco.
- `CRON_SECRET` — opcional, mas recomendado. Qualquer string aleatória. A Vercel
  automaticamente envia esse valor no header `Authorization: Bearer <CRON_SECRET>`
  quando dispara os crons.

A integração de WhatsApp (Superchat ou Z-API) **não depende mais de variáveis de ambiente** —
é configurada direto no app, em **Configurações → Parâmetros**: escolha o provedor e cole os
tokens ali. Eles ficam salvos criptografados no banco (nunca em texto puro, nunca devolvidos
pro navegador depois de salvos). As variáveis `SUPERCHAT_*`/`ZAPI_*` em `.env.example` continuam
funcionando como fallback legado, mas só valem enquanto o campo correspondente não for
preenchido em Parâmetros.

## Lembretes automáticos

Dois cron jobs (configurados em `vercel.json`) rodam todo dia às 09:00 (horário de Brasília):

- `/api/cron/payment-reminders` — verifica pedidos com sinal ou restante perto do
  vencimento (conforme configurado em **Configurações**) e envia mensagem de cobrança
  para o WhatsApp da cliente.
- `/api/cron/delivery-alerts` — verifica pedidos com entrega próxima e envia um alerta
  interno para o número configurado em Configurações → Parâmetros.

Os prazos (quantos dias de antecedência) são ajustáveis em **Configurações** dentro do sistema.

## Banco de dados

Não usa migrações separadas — as tabelas são criadas automaticamente (`CREATE TABLE IF NOT EXISTS`)
na primeira requisição à API. Não é necessário rodar nenhum comando manual.

## Stack

Next.js (App Router) + Postgres (`pg`) + JWT em cookie httpOnly (`jose`) + Tailwind.
