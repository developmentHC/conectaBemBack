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

2. Crie um arquivo .env com as suas respectivas variáveis de ambiente

```sh
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
SENDGRID_API_KEY=apikey
PORT=3000
ACCESS_TOKEN_SECRET=JWT_ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET=JWT_REFRESH_TOKEN_SECRET
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
