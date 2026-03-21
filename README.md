# ConectaBem APIs

## Projeto Node.js com MongoDB e Express

Este projeto é um exemplo de API RESTful usando Node.js, Express, MongoDB e Mongoose. Ele inclui funcionalidades para verificar se um e-mail de usuário está registrado, enviar e verificar OTPs, e manusear variáveis de ambiente com `dotenv`.

### Pré-requisitos

- Node.js e npm instalados.
- MongoDB Atlas ou servidor MongoDB local configurado.
- Um arquivo `.env` configurado na raiz do projeto.

### Instalação

1. Clone o repositório:

```sh
git clone https://github.com/ConectaBemApp/backend.git
cd backend
```

2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```sh
MONGODB_URI=seu_mongodb_uri
PORT=3000
GMAIL_USER=seu_email@gmail.com
GMAIL_PASS=sua_senha
ACCESS_TOKEN_SECRET=sua_jwt_access_secret
REFRESH_TOKEN_SECRET=sua_jwt_refresh_secret
FRONT_WEBHOOK_URL=url_para_webhook_do_frontend
WEBHOOK_SECRET=segredo_webhook
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
```

3. Construa a imagem Docker:

```sh
docker build -t conectabem .
docker run -it --rm -p 3000:3000 conectabem npm run dev
```

4. Acesse sua aplicação:

```sh
http://localhost:3000/docs
```
