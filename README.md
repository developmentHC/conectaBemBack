# Conecta Bem — API

API REST do Conecta Bem, plataforma que conecta pacientes a profissionais de medicinas alternativas.

**Stack:** Node.js 20 · Express 4 · MongoDB 7 · Mongoose 8 · ES Modules (`.mjs`)

---

## Pré-requisitos

- Node.js 20+
- npm
- MongoDB 7 (local via Docker ou remoto via Atlas)

---

## Instalação

1. Clone o repositório:

```sh
git clone https://github.com/developmentHC/conectaBemBack.git
cd conectaBemBack
```

2. Instale as dependências:

```sh
npm install
```

3. Copie o arquivo de variáveis de ambiente:

```sh
cp .env.example .env
```

4. Preencha o `.env` com os valores do seu ambiente (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente)).

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `MONGODB_URI` | URI de conexão ao MongoDB | Sim |
| `ACCESS_TOKEN_SECRET` | Secret para assinar JWT de acesso | Sim |
| `REFRESH_TOKEN_SECRET` | Secret para assinar JWT de refresh | Sim |
| `GMAIL_USER` | E-mail Gmail para envio via SMTP | Sim |
| `GMAIL_PASS` | Senha de app do Gmail | Sim |
| `FRONT_WEBHOOK_URL` | URL do webhook do frontend | Sim |
| `WEBHOOK_SECRET` | Secret do webhook | Sim |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary | Sim |
| `CLOUDINARY_API_KEY` | API key do Cloudinary | Sim |
| `CLOUDINARY_API_SECRET` | API secret do Cloudinary | Sim |
| `TEST_OTP_ENABLED` | Ativa bypass de OTP para QA (`true`/vazio) | Apenas em dev/staging |

---

## Como Rodar

### Desenvolvimento

```sh
npm run dev
```

Inicia o servidor com nodemon na porta `3000` (com hot reload). Swagger UI disponível em `http://localhost:3000/docs`.

### Produção

```sh
npm start
```

### Testes unitários

```sh
npm test
```

---

## Docker (MongoDB local)

Para subir um MongoDB local via Docker Compose:

```sh
docker-compose -f docker-compose.dev.yaml up -d
```

Depois configure `MONGODB_URI=mongodb://localhost:27017/conectabem` no `.env`.

---

## QA — Bypass de OTP e Usuários de Teste

Esta seção documenta a infraestrutura de bypass de autenticação para automação de testes E2E.

### Como funciona

Em ambientes de desenvolvimento e staging, e-mails do domínio `@test.conectabem.com` aceitam o OTP fixo `000000` sem envio de e-mail real. O fluxo de autenticação é idêntico ao de produção — apenas a verificação do OTP é diferente.

### Ativação

O bypass exige **duas condições simultâneas**:

1. `NODE_ENV` diferente de `production` (automaticamente satisfeito em `npm run dev`)
2. `TEST_OTP_ENABLED=true` no `.env`

```sh
# No .env do ambiente de desenvolvimento/staging
TEST_OTP_ENABLED=true
```

**Atenção:** O bypass é completamente desabilitado em produção (`NODE_ENV=production`), mesmo que `TEST_OTP_ENABLED` esteja definido.

### E-mails de teste disponíveis

| E-mail | Tipo de usuário | Perfil |
|--------|-----------------|--------|
| `patient@test.conectabem.com` | Paciente | Completo (status `completed`) |
| `professional@test.conectabem.com` | Profissional | Completo (status `completed`) |

### OTP fixo

```
000000
```

Use este OTP em `POST /auth/checkOTP` para qualquer e-mail `@test.conectabem.com` com o bypass ativo.

### Criar usuários de teste no banco

Execute o seed para criar os usuários de teste no MongoDB:

```sh
npm run seed:test-users
```

O script é **idempotente** — pode ser re-executado a qualquer momento sem criar duplicatas.

**Pré-requisito:** `MONGODB_URI` configurado no `.env` apontando para o banco de desenvolvimento/staging.

---

## Documentação da API

Swagger UI disponível em `http://localhost:3000/docs` após iniciar o servidor.
