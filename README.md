# Stickê

Plataforma de figurinhas PNG para empreendedoras, construída com Next.js 15,
Tailwind CSS 4, Supabase e Mercado Pago.

## Configuração local

1. Instale as dependências com `npm install`.
2. Preencha `.env.local` usando `.env.local.example`.
3. Execute `supabase/schema.sql` no SQL Editor do Supabase.
4. Configure no Supabase Auth a URL do site e o redirecionamento `/auth/callback`.
5. O cadastro confirma o e-mail no servidor e entra direto no checkout; SMTP é usado apenas para recuperação de senha.
6. Rode `npm run dev`.

O SQL cria perfis vinculados ao Supabase Auth, compras com RLS e o bucket privado
`sticke-assets`. As imagens da galeria são entregues por URLs assinadas de 15 minutos.

## Variáveis

- `NEXT_PUBLIC_APP_URL`: URL pública da aplicação, sem barra final.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave pública recomendada pelo Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública legada, aceita como alternativa.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço, somente no servidor.
- `NEXT_PUBLIC_MP_PUBLIC_KEY`: chave pública usada pelo Payment Brick.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado do Mercado Pago, somente no servidor.
- `MERCADOPAGO_WEBHOOK_SECRET`: assinatura secreta exibida na configuração do webhook.
- `ADMIN_PASSWORD`: senha do painel administrativo, somente no servidor.

Nunca use o prefixo `NEXT_PUBLIC_` em chaves privadas.

## Fluxo de compra

1. A cliente cria uma conta com nome, telefone, e-mail e senha.
2. O Supabase Auth guarda a senha; a aplicação não recebe nem armazena esse valor.
3. O Payment Brick envia dados de cartão diretamente ao Mercado Pago.
4. O servidor força o preço de R$ 37,90 e cartão em uma parcela.
5. O webhook assinado confirma o pagamento e ativa `lifetime_access`.
6. A cliente entra em qualquer dispositivo com a própria conta e acessa a galeria.

Não existe bloqueio rígido por aparelho. O compartilhamento de um código permanente foi
removido; o controle agora é feito por conta autenticada e arquivos temporariamente assinados.

## Upload massivo

Cada subpasta informada vira uma categoria. As imagens dentro dela são enviadas ao
Storage e cadastradas como figurinhas.

Confira o plano sem enviar nada:

```powershell
npm run upload-stickers -- --root "C:\caminho\para\as\figurinhas" --dry-run
```

Execute o upload:

```powershell
npm run upload-stickers -- --root "C:\caminho\para\as\figurinhas"
```

Use `--concurrency 5` para controlar uploads simultâneos. O script aceita PNG, JPG
e WebP de até 10 MB e evita duplicar registros já cadastrados.
