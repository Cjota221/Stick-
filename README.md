# Stickê

Loja de packs de figurinhas PNG para empreendedoras, construída com Next.js 15,
Tailwind CSS 4, Supabase e Mercado Pago.

## Configuração local

1. Instale as dependências com `npm install`.
2. Preencha `.env.local`.
3. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do Supabase.
4. Rode `npm run dev`.

O bucket público `sticke-assets`, seu limite de 10 MB e a policy de leitura são
criados pelo script SQL.

## Variáveis

- `NEXT_PUBLIC_APP_URL`: URL pública da aplicação.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anônima do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço, usada apenas no servidor.
- `MERCADOPAGO_ACCESS_TOKEN`: token de produção ou teste do Mercado Pago.
- `ADMIN_PASSWORD`: senha do painel administrativo, usada apenas no servidor.

## Fluxo

O checkout cria uma compra pendente e um pagamento PIX. O webhook e a galeria
consultam o Mercado Pago para liberar o conteúdo quando o pagamento for aprovado.
