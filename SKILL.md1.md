---
name: saas-data-security
description: >
  Escudo de segurança de dados obrigatório para todos os SaaS do portfólio CJ/C4/Carol.
  Previne vazamento de dados sensíveis no frontend (console, DevTools, localStorage, Network tab)
  e garante RLS, variáveis de ambiente, rotas de API e configurações de pagamento seguras.

  ACIONAR OBRIGATORIAMENTE em TODA e QUALQUER situação que envolva:
  criar um novo SaaS ou atualização de SaaS existente,
  adicionar integração com Mercado Pago, Supabase, Evolution API, n8n, Meta Ads API,
  criar componentes React/Next.js que recebam ou exibam dados do usuário,
  criar API routes, Server Actions ou funções serverless (Netlify Functions),
  adicionar autenticação, sessão ou controle de acesso,
  usar console.log, useState, useEffect com dados vindos de API,
  configurar variáveis de ambiente (.env, Netlify env vars),
  fazer deploy em produção de qualquer sistema,
  qualquer menção a "vazamento", "dados visíveis", "console", "DevTools", "dados de pagamento",
  "token exposto", "chave pública", "RLS", "Row Level Security", "política de acesso".

  Esta skill é um BLOQUEIO — nenhum código de SaaS deve ser entregue sem passar por este checklist.
---

# SaaS Data Security Shield — Protocolo Obrigatório de Segurança

> **Regra de ouro:** Se um dado pode causar dano financeiro, de privacidade ou reputacional ao ser visto por alguém não autorizado, ele NUNCA pode aparecer no frontend, no console ou em qualquer log público.

---

## PASSO 0 — ANTES DE ESCREVER QUALQUER CÓDIGO

Toda vez que iniciar ou atualizar um SaaS, responda mentalmente estas 3 perguntas:

1. **Onde esse dado vai chegar?** (servidor, cliente, localStorage, console?)
2. **Quem pode ver esse dado?** (só o dono? qualquer usuário logado? qualquer pessoa?)
3. **O que acontece se esse dado vazar?** (prejuízo financeiro? fraude? perda de dados?)

Se a resposta a qualquer uma dessas perguntas for "não sei" — **pare e resolva antes de codar**.

---

## BLOCO 1 — VAZAMENTO VIA CONSOLE (PRIORIDADE MÁXIMA)

### O problema
Todo `console.log()` no código frontend é visível para qualquer pessoa que abrir o DevTools (F12) no navegador. Isso inclui clientes, concorrentes, atacantes.

### O que NUNCA pode aparecer no console

```typescript
// ❌ PROIBIDO — dados de pagamento
console.log('PIX response:', pixData)
console.log('MP token:', cardToken)
console.log('Payment result:', paymentResult)

// ❌ PROIBIDO — dados de usuário
console.log('User data:', user)
console.log('Session:', session)
console.log('Auth token:', token)

// ❌ PROIBIDO — chaves e tokens de API
console.log('API key:', process.env.MERCADO_PAGO_ACCESS_TOKEN)
console.log('Supabase key:', supabaseKey)
console.log('Evolution token:', evolutionToken)

// ❌ PROIBIDO — dados de revendedoras/clientes
console.log('Reseller data:', resellerData)
console.log('Order details:', order)
console.log('CPF/CNPJ:', customer.document)
console.log('Telefone:', customer.phone)
```

### O que é permitido no console (apenas em desenvolvimento)

```typescript
// ✅ PERMITIDO apenas em DEV — nunca em produção
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] Payment flow started')  // sem dados reais
  console.log('[DEBUG] Step:', currentStep)    // apenas estado de fluxo
}

// ✅ MELHOR — usar IDs ou status, nunca o objeto completo
console.log('[DEBUG] Payment status:', paymentResult.status)  // 'approved' / 'rejected'
console.log('[DEBUG] Order ID:', order.id)  // apenas o ID, nunca o objeto todo
```

### Implementação obrigatória — remover console.log em produção

**Arquivo: `next.config.js` ou `next.config.ts`**

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Remove todos os console.log em produção automaticamente
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // mantém apenas erros e warnings
    } : false,
  },
}

export default nextConfig
```

**Para projetos sem Next.js — usar plugin do bundler:**

```bash
# Vite
npm install vite-plugin-remove-console --save-dev
```

```typescript
// vite.config.ts
import removeConsole from 'vite-plugin-remove-console'

export default {
  plugins: [
    removeConsole({ includes: ['log', 'debug', 'info'] })
  ]
}
```

---

## BLOCO 2 — VARIÁVEIS DE AMBIENTE (CRÍTICO)

### A regra fundamental do Next.js

| Prefixo | Onde fica | Visível no browser? | Uso |
|---------|-----------|---------------------|-----|
| `NEXT_PUBLIC_` | Bundle do cliente | **SIM — PÚBLICO** | Apenas dados não sensíveis |
| Sem prefixo | Apenas servidor | Não — privado | Chaves, tokens, secrets |

### O que NUNCA pode ser `NEXT_PUBLIC_`

```bash
# ❌ PROIBIDO — essas variáveis ficam expostas no bundle JS do cliente
NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
NEXT_PUBLIC_EVOLUTION_API_KEY=xxxx
NEXT_PUBLIC_META_ACCESS_TOKEN=EAAxxxx
NEXT_PUBLIC_DATABASE_URL=postgresql://xxxx
NEXT_PUBLIC_N8N_WEBHOOK_SECRET=xxxx
```

```bash
# ✅ CORRETO — sem prefixo = apenas no servidor
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
EVOLUTION_API_KEY=xxxx
META_ACCESS_TOKEN=EAAxxxx

# ✅ PERMITIDO como NEXT_PUBLIC (dados não sensíveis)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx  # anon key com RLS = seguro
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxx  # public key do MP = seguro
NEXT_PUBLIC_APP_URL=https://meuapp.com
```

### Template de .env para todos os projetos Carol

```bash
# ============================================
# SERVIDOR APENAS — NUNCA EXPOR AO CLIENTE
# ============================================
SUPABASE_SERVICE_ROLE_KEY=                # admin do Supabase
MERCADO_PAGO_ACCESS_TOKEN=               # pagamentos (server-side)
MERCADO_PAGO_WEBHOOK_SECRET=             # validação de webhooks
EVOLUTION_API_KEY=                       # WhatsApp API
META_ACCESS_TOKEN=                       # Meta Ads API
N8N_WEBHOOK_AUTH=                        # autenticação n8n
CRON_SECRET=                             # proteção de crons

# ============================================
# CLIENTE — SEGURO SER PÚBLICO (com RLS ativo)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MP_PUBLIC_KEY=               # apenas public key do MP
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
```

---

## BLOCO 3 — SUPABASE RLS (ROW LEVEL SECURITY)

### Regra obrigatória

**Toda tabela que contém dados de usuários DEVE ter RLS habilitado.**
Sem RLS, qualquer pessoa com a anon key pode ler todos os dados.

### Políticas básicas obrigatórias por tipo de tabela

```sql
-- ============================================
-- HABILITAR RLS NA TABELA (SEMPRE PRIMEIRO)
-- ============================================
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABELA DE USUÁRIOS / PERFIS
-- ============================================
-- Usuário só vê e edita seus próprios dados
CREATE POLICY "usuarios_select_proprio"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "usuarios_update_proprio"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- TABELA DE PEDIDOS / ORDERS
-- ============================================
-- Usuário só vê seus próprios pedidos
CREATE POLICY "pedidos_select_proprio"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Admin vê tudo (usando custom claim ou tabela de roles)
CREATE POLICY "pedidos_admin_select_tudo"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- TABELA DE PAGAMENTOS (CRÍTICA)
-- ============================================
-- NUNCA permitir INSERT ou UPDATE pelo cliente
-- Apenas server-side via service role key

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Usuário pode VER seus pagamentos
CREATE POLICY "pagamentos_select_proprio"
ON payments FOR SELECT
USING (auth.uid() = user_id);

-- NINGUÉM pode inserir pagamentos pelo cliente
-- (inserção apenas via API route com service role)
-- Não criar política de INSERT = bloqueia por padrão ✅

-- ============================================
-- TABELA MULTI-TENANT (C4 Franquias / VEXX)
-- ============================================
CREATE POLICY "tenant_isolamento"
ON tabela_qualquer FOR ALL
USING (tenant_id = auth_tenant_id()); -- função customizada de tenant

-- ============================================
-- VERIFICAR SE RLS ESTÁ ATIVO (AUDITORIA)
-- ============================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Se retornar alguma linha = PROBLEMA! Essas tabelas estão abertas.
```

### SQL de auditoria completa de RLS

```sql
-- Listar todas as tabelas SEM RLS habilitado
SELECT
  schemaname,
  tablename,
  'RISCO: RLS DESABILITADO' as status
FROM pg_tables
WHERE schemaname IN ('public', 'cjota')
AND rowsecurity = false
ORDER BY tablename;

-- Listar todas as políticas existentes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname IN ('public', 'cjota')
ORDER BY tablename, policyname;
```

---

## BLOCO 4 — DADOS DE PAGAMENTO (MERCADO PAGO)

### Fluxo CORRETO — tokenização server-side

```
Cliente → [public key no browser] → MP SDK → Card Token
Card Token → [envia ao servidor] → API Route
API Route → [access token no servidor] → MP API → Charge
Resultado → [apenas status] → Cliente
```

### Fluxo ERRADO que expõe dados

```
// ❌ NUNCA FAÇA ISSO
// access token no cliente = qualquer um pode fazer cobranças com seu token
const mp = new MercadoPago(process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN)
```

### Implementação correta no Next.js

```typescript
// app/api/payment/create/route.ts — SERVIDOR APENAS
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!, // sem NEXT_PUBLIC_
})

export async function POST(request: Request) {
  // Validar autenticação do usuário ANTES de processar pagamento
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    request.headers.get('Authorization')?.replace('Bearer ', '') || ''
  )
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, amount, description } = await request.json()

  // Nunca logar dados de pagamento
  const payment = new Payment(client)
  const result = await payment.create({
    body: {
      token,          // card token (seguro passar)
      transaction_amount: amount,
      description,
      payment_method_id: 'credit_card',
      payer: { email: user.email },
    }
  })

  // Retornar APENAS o necessário ao cliente
  return Response.json({
    status: result.status,         // 'approved' | 'rejected' | 'pending'
    id: result.id,                 // ID da transação (pode retornar)
    // ❌ NÃO retornar: result inteiro, card data, payer data
  })
}
```

### Validação de Webhook (OBRIGATÓRIA)

```typescript
// app/api/webhooks/mercadopago/route.ts
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') || ''
  const requestId = request.headers.get('x-request-id') || ''
  const dataId = new URL(request.url).searchParams.get('data.id') || ''

  // Validar assinatura HMAC — sem isso qualquer um pode simular pagamento
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET!
  const signedTemplate = `id:${dataId};request-id:${requestId};ts:${Date.now()};`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedTemplate)
    .digest('hex')

  // Extrair ts e v1 da signature header
  const parts = Object.fromEntries(
    signature.split(',').map(p => p.split('='))
  )

  const computed = crypto
    .createHmac('sha256', secret)
    .update(`id:${dataId};request-id:${requestId};ts:${parts.ts};`)
    .digest('hex')

  if (computed !== parts.v1) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Processar pagamento aqui
  const data = JSON.parse(body)
  // ...

  return Response.json({ received: true })
}
```

---

## BLOCO 5 — DADOS SENSÍVEIS NO ESTADO REACT

### O problema do estado do React

Dados no estado React aparecem em:
- React DevTools (extensão do Chrome/Firefox)
- Console quando você usa `console.log(state)`
- Erro reports (Sentry, etc.) que logam o estado

### Padrão seguro para dados sensíveis

```typescript
// ❌ ERRADO — armazena token inteiro no estado
const [userData, setUserData] = useState({
  id: '',
  email: '',
  token: '',          // ← NUNCA no estado do cliente
  cpf: '',            // ← NUNCA no estado do cliente
  creditCard: {},     // ← NUNCA no estado do cliente
})

// ✅ CORRETO — estado mínimo no cliente
const [userData, setUserData] = useState({
  id: '',
  email: '',
  name: '',
  // Dados sensíveis ficam no servidor, gerenciados via HTTP-only cookies
})

// ✅ CORRETO — dados de pagamento nunca ficam no estado
// Usar apenas no momento da submissão via SDK do MP
const handlePayment = async () => {
  const mp = new MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!)
  const cardForm = mp.cardForm({ ... })
  const token = await cardForm.getCardFormData() // obtém e descarta logo em seguida
  await processPayment(token) // envia ao servidor e não armazena
}
```

---

## BLOCO 6 — LOCALSTORAGE E SESSIONSTORAGE

### O que NUNCA armazenar

```typescript
// ❌ PROIBIDO — qualquer dado sensível no storage do browser
localStorage.setItem('user_token', token)
localStorage.setItem('payment_data', JSON.stringify(paymentData))
localStorage.setItem('mp_access_token', accessToken)
sessionStorage.setItem('cpf', document)
sessionStorage.setItem('card_token', cardToken)
```

### O que é seguro armazenar

```typescript
// ✅ PERMITIDO — apenas preferências e dados não sensíveis
localStorage.setItem('theme', 'dark')
localStorage.setItem('language', 'pt-BR')
localStorage.setItem('last_viewed_page', '/dashboard')
localStorage.setItem('sidebar_collapsed', 'true')
```

### Autenticação correta — usar cookies HTTP-only

```typescript
// No servidor (API route) — cookie HTTP-only não é acessível via JS
response.cookies.set('session', sessionToken, {
  httpOnly: true,     // ← JS do browser NÃO consegue ler
  secure: true,       // ← apenas via HTTPS
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/',
})
```

---

## BLOCO 7 — HEADERS DE SEGURANÇA

### Configuração obrigatória no Next.js

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'  // previne clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.mercadopago.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com wss://*.supabase.co",
    ].join('; ')
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}
```

### netlify.toml — configuração de headers no Netlify

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

---

## BLOCO 8 — API ROUTES SEGURAS

### Padrão obrigatório para toda API route

```typescript
// app/api/[rota]/route.ts — TEMPLATE SEGURO
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Client admin — apenas no servidor, NUNCA expor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // sem NEXT_PUBLIC_
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    // 1. SEMPRE validar autenticação primeiro
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar e sanitizar input
    const body = await request.json()
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // 3. Lógica de negócio aqui
    // ...

    // 4. Retornar apenas o necessário
    return Response.json({ success: true, id: result.id })

  } catch (error) {
    // 5. Log de erro NO SERVIDOR (não no cliente), sem dados sensíveis
    console.error('[API Error]', {
      route: request.url,
      timestamp: new Date().toISOString(),
      // NÃO logar: body, headers de auth, dados do usuário
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## BLOCO 9 — EXPOSIÇÃO NA ABA NETWORK DO DEVTOOLS

### O que não deve aparecer nas requisições de rede

```typescript
// ❌ ERRADO — passa tokens em query params (ficam na URL e no histórico)
fetch(`/api/payment?token=${cardToken}&user=${userId}`)
fetch(`/api/data?access_token=${apiKey}`)

// ✅ CORRETO — tokens sempre no header ou no body via POST
fetch('/api/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`, // no header
  },
  body: JSON.stringify({
    token: cardToken, // no body, não na URL
    amount: 100,
  }),
})
```

### Dados que podem aparecer no Network tab (é normal)

- IDs de pedidos
- Status de pagamento ('approved', 'rejected')
- Dados públicos do produto (nome, preço)

### Dados que NUNCA podem aparecer no Network tab

- Tokens de acesso (`access_token`, `Bearer xxx`)
- Card tokens do Mercado Pago
- CPF/CNPJ completo
- Dados bancários
- Chaves de API

---

## BLOCO 10 — CHECKLIST DE AUDITORIA PRÉ-DEPLOY

Execute este checklist **obrigatoriamente** antes de qualquer deploy em produção:

### Checklist de Console

```
[ ] Busquei "console.log" no projeto inteiro e removi ou envolvi em if(DEV)
[ ] Configurei removeConsole no next.config para produção
[ ] Testei com DevTools aberto e confirmei que nada sensível aparece
```

### Checklist de Variáveis de Ambiente

```
[ ] Auditei todas as variáveis com NEXT_PUBLIC_ — confirmei que são seguras
[ ] MERCADO_PAGO_ACCESS_TOKEN não tem prefixo NEXT_PUBLIC_
[ ] SUPABASE_SERVICE_ROLE_KEY não tem prefixo NEXT_PUBLIC_
[ ] EVOLUTION_API_KEY não tem prefixo NEXT_PUBLIC_
[ ] META_ACCESS_TOKEN não tem prefixo NEXT_PUBLIC_
[ ] Arquivo .env está no .gitignore
[ ] .env.example existe com valores vazios (para referência)
```

### Checklist de Supabase RLS

```sql
-- Rodar no Supabase SQL Editor antes de ir pra produção:
SELECT schemaname, tablename, 'SEM RLS!' as alerta
FROM pg_tables
WHERE schemaname IN ('public', 'cjota')
AND rowsecurity = false;

-- Se retornar QUALQUER linha = BLOQUEAR DEPLOY até corrigir
```

```
[ ] Query acima retornou zero linhas (todas as tabelas com RLS)
[ ] Testei com usuário A tentando acessar dados do usuário B (deve falhar)
[ ] Admin consegue ver tudo que precisa ver
[ ] Usuário comum não consegue ver dados de outros usuários
```

### Checklist de Pagamento

```
[ ] Fluxo de pagamento usa tokenização client-side + processamento server-side
[ ] Webhook valida assinatura HMAC antes de processar
[ ] Resultado do pagamento retorna apenas status e ID (não o objeto completo)
[ ] Não estou armazenando dados de cartão em nenhum lugar
```

### Checklist de API Routes

```
[ ] Toda rota verifica autenticação antes de qualquer operação
[ ] Inputs são validados (tipo, formato, limites)
[ ] Erros retornam mensagens genéricas ao cliente, detalhes apenas no log do servidor
[ ] Nenhuma rota aceita dados do usuário sem sanitização
```

### Checklist de Storage do Browser

```
[ ] localStorage não contém tokens, CPFs ou dados de pagamento
[ ] sessionStorage não contém dados sensíveis
[ ] Autenticação usa cookies HTTP-only, não localStorage
```

### Checklist Final (DevTools Manual)

```
Abrir o sistema no browser com DevTools (F12) e verificar:
[ ] Aba Console: nenhum dado sensível aparece ao usar o sistema
[ ] Aba Network: nenhum token aparece em query params de URL
[ ] Aba Application > Local Storage: apenas preferências de UI
[ ] Aba Application > Session Storage: vazio ou apenas dados não sensíveis
[ ] Aba Application > Cookies: session cookie tem HttpOnly e Secure marcados
[ ] Aba Sources: procurar por "access_token", "secret", "password" — zero resultados
```

---

## BLOCO 11 — PROJETOS DO PORTFÓLIO — RISCOS MAPEADOS

### Precifique (calculadoraprecifique.com)

- **Risco alto:** Token de pagamento Mercado Pago no fluxo PIX
- **Ação:** Confirmar que `MERCADO_PAGO_ACCESS_TOKEN` não está em NEXT_PUBLIC_
- **Ação:** Webhook PIX valida assinatura HMAC
- **Ação:** Dados de afiliados não expostos no console

### C4 Franquias (c4franquias.com)

- **Risco alto:** Dados de revendedoras, pedidos drop, wallets
- **Ação:** RLS obrigatório nas tabelas `revendedoras`, `pedidos`, `wallets`
- **Ação:** Admin panel separado com verificação de role em toda API route
- **Ação:** FacilZap API key apenas server-side

### VEXX CRM (vexxcrm.netlify.app)

- **Risco crítico:** Meta Access Token armazenado no banco — nunca expor ao frontend
- **Ação:** `meta_access_token` da tabela `tenants` apenas acessível server-side
- **Ação:** Evolution API key nunca no cliente
- **Ação:** Mensagens do WhatsApp não devem aparecer no console

### Imprimax / Forja / Zakar

- **Ação padrão:** Aplicar checklist completo antes de cada deploy
- **Ação:** Supabase anon key com RLS ativo em todas as tabelas de dados de usuários

---

## BLOCO 12 — DETECÇÃO DE VAZAMENTO EM CÓDIGO EXISTENTE

### Script de varredura rápida (rodar no terminal do projeto)

```bash
# Windows PowerShell — buscar console.log com dados potencialmente sensíveis
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "console\.log" -Recurse

# Buscar NEXT_PUBLIC_ em variáveis potencialmente sensíveis
Select-String -Path ".env*" -Pattern "NEXT_PUBLIC_.*(TOKEN|KEY|SECRET|PASSWORD|ACCESS)"

# Buscar uso de localStorage com dados sensíveis
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "localStorage\.setItem" -Recurse

# Buscar tokens em query params
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "fetch.*\?.*token=" -Recurse
```

```bash
# macOS/Linux (para referência)
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"
grep -r "NEXT_PUBLIC_" .env* | grep -E "(TOKEN|KEY|SECRET|ACCESS)"
grep -r "localStorage.setItem" src/ --include="*.ts"
```

---

## RESUMO EXECUTIVO — AS 7 LEIS DE SEGURANÇA CAROL

1. **Dados sensíveis só no servidor** — token, CPF, cartão, chave de API nunca chegam ao browser
2. **NEXT_PUBLIC_ = público** — se não pode ser visto por qualquer pessoa, não coloca NEXT_PUBLIC_
3. **RLS antes de qualquer tabela ir pra produção** — sem RLS = banco aberto
4. **console.log = proibido em produção** — configure removeConsole no Next.js
5. **Webhook valida assinatura** — sem validação HMAC = qualquer um simula pagamento
6. **API route começa com autenticação** — primeiro if do código é sempre verificar quem é o usuário
7. **Checklist antes de todo deploy** — não é opcional, é lei do portfólio
