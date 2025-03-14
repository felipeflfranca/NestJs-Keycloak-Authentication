# Nest Keycloak Backend

Este repositório contém uma aplicação **NestJS** para gerenciamento de usuários, utilizando **Keycloak** como provedor de identidade e **PostgreSQL** como banco de dados. A aplicação oferece endpoints para autenticação, autorização (via JWT) e operações CRUD para usuários, integrados ao Keycloak para controle de papéis (roles).

---

## 📑 Sumário

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Pré-requisitos](#pré-requisitos)
4. [Configuração com Docker](#configuração-com-docker)
5. [Configuração Manual (Sem Docker)](#configuração-manual-sem-docker)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Principais Endpoints](#principais-endpoints)
   - [Autenticação (/auth)](#autenticação-auth)
   - [Usuários (/users)](#usuários-users)
8. [Exemplos de Uso (cURL)](#exemplos-de-uso-curl)
9. [Licença](#licença)

---

## 🔍 Visão Geral

O objetivo deste projeto é fornecer uma API robusta para:

- **Autenticação e Autorização** utilizando JWT integrado ao **Keycloak**.
- **CRUD de Usuários**, com operações de criação, atualização e exclusão sincronizadas com o Keycloak.
- **Gerenciamento de papéis (roles)**, garantindo controle de acesso refinado na aplicação.

---

## 🛠 Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** – Framework Node.js para aplicações escaláveis em TypeScript.
- **[Keycloak](https://www.keycloak.org/)** – Servidor de identidade e gerenciamento de usuários/roles.
- **[PostgreSQL](https://www.postgresql.org/)** – Banco de dados relacional.
- **Docker e Docker Compose** – Para orquestrar os serviços localmente.
- **Axios** – Para consumo de serviços externos (Keycloak).
- **Passport + Passport-JWT** – Estratégia de autenticação via JWT.
- **class-validator / class-transformer** – Validação e transformação de DTOs.
- **ESLint / Prettier** – Padronização e formatação de código.
- **Jest** – Framework de testes para JavaScript/TypeScript.

---

## ⚙️ Configuração com Docker

1. **Subindo os serviços**:

   docker-compose up -d

2. **Acesso aos serviços**:
   - **API NestJS**: [http://localhost:3000](http://localhost:3000)
   - **Keycloak**: [http://localhost:8080](http://localhost:8080)

---

## 🔗 Principais Endpoints

### Autenticação (`/auth`)

- **Login**  
  Envia credenciais para autenticação e obtenção do token de acesso:

      curl -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=usuarioExemplo" \
      -d "password=senhaExemplo"

- **Refresh Token**  
  Solicita a renovação do token de acesso utilizando o refresh token:

      curl -X POST http://localhost:3000/auth/refresh \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "refreshToken=seu-refresh-token-fake"

### Usuários (`/users`)

- **Criar Usuário**  
  Cria um novo usuário com dados fictícios:

      curl -X POST http://localhost:3000/users \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer seu_access_token_falso" \
      -d '{
        "username": "usuarioFake001",
        "email": "usuario.fake001@example.com",
        "firstName": "NomeFalso",
        "lastName": "SobrenomeFalso",
        "password": "senhaSegura001",
        "roles": ["ROLE_VIEW"]
      }'

- **Atualizar Usuário**  
  Atualiza os dados de um usuário existente:

      curl -X PUT http://localhost:3000/users/{userId} \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer seu_access_token_falso" \
      -d '{
      "username": "usuarioFake002",
      "email": "usuario.fake002@example.com",
      "firstName": "NomeAtualizado",
      "lastName": "SobrenomeAtualizado",
      "password": "novaSenhaSegura002",
      "roles": ["ROLE_VIEW"]
      }'


  **Nota:** Substitua `{userId}` pelo identificador do usuário a ser atualizado.

- **Excluir Usuário**  
  Remove um usuário a partir do seu ID:

      curl -X DELETE http://localhost:3000/users/{userId} \
      -H "Content-Type: application/json"

  **Nota:** Substitua `{userId}` pelo identificador do usuário a ser excluído.

