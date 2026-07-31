# 🍽️ Missionary Lunch

Sistema de gestão de **almoços missionários**: conecta **famílias anfitriãs** da igreja aos **missionários** para o almoço semanal, com calendário visual, controle de **P-Day** (Dia de Preparação) e escala organizada.

> Projeto desenvolvido para apoiar a coordenação de missionários da igreja no agendamento de almoços, substituindo planilhas e conversas de WhatsApp por uma única fonte de verdade.

---

## ✨ Funcionalidades

- **Calendário mensal** com os almoços agendados, dias bloqueados (P-Day) e criação/edição direta por clique na data
- **Gestão de missionários** — cadastro com gênero (Élder / Irmã), período de missão, área e telefone, com barra de progresso e dias restantes
- **Gestão de famílias** — cadastro com contato, telefone, e-mail e endereço, organizadas por letra
- **Gestão de P-Day** — dia da semana recorrente sem almoço, com histórico de configurações e **exceções** (liberar uma data por transferência, bloquear feriados etc.)
- **Almços** — agendamento por família + seleção de missionários, com proteção contra datas de P-Day
- **Autenticação JWT** com papéis (`ADMIN` e `COORDINATOR`)
- **Exportação da escala em PDF** (calendário do mês)
- **Swagger** para documentação da API em `/api/docs`
- **Keep-alive automático** do banco (evita que o cluster MongoDB Atlas gratuito entre em modo de pausa)

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, FullCalendar, TanStack Query, Zustand |
| Backend | NestJS 11, TypeScript, Prisma 6, Passport (JWT) |
| Banco de dados | MongoDB (Atlas ou local) |
| Outros | Swagger, @nestjs/schedule, Sonner (toasts), react-hook-form + Zod |

O projeto está organizado como um monorepo simples (sem workspaces), com dois apps independentes:

```
missionary-lunch/
├── apps/
│   ├── api/   # Backend NestJS (REST + Swagger)
│   └── web/   # Frontend React (SPA)
```

---

## 📋 Pré-requisitos

- **Node.js** ≥ 18 (recomendado 20+)
- **npm**
- **MongoDB** — um dos seguintes:
  - Cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0), ou
  - MongoDB local rodando como **replica set** (necessário pelo Prisma)

---

## 🚀 Como rodar localmente

### 1. Configurar o banco de dados

**Opção A — MongoDB Atlas (produção):**

1. Crie um cluster M0 em [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crie um usuário de banco e copie a connection string `mongodb+srv://...`
3. Coloque-a na variável `DATABASE_URL`

**Opção B — MongoDB local (desenvolvimento):**

O Prisma com MongoDB exige que o servidor rode como **replica set**:

```bash
mongod --replSet rs0 --dbpath ./data/db --port 27017
# em outro terminal, uma única vez:
mongosh --eval "rs.initiate()"
```

### 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env` em `apps/api` e preencha:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Connection string do MongoDB | `mongodb://localhost:27017/missionary_lunch` |
| `JWT_SECRET` | Chave secreta para assinatura dos tokens | string aleatória longa |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `PORT` | Porta da API | `3000` |

### 3. Subir a API

```bash
cd apps/api
npm install
npx prisma db push        # sincroniza o schema com o banco (cria as collections)
npm run db:seed           # (opcional) dados de demonstração: famílias, missionários, almoços e troca de P-Day
npm run start:dev         # http://localhost:3000/api
```

O seed é **idempotente** (pode rodar várias vezes) e cria usuários de acesso demo:

| Papel | E-mail | Senha |
|---|---|---|
| ADMIN | `admin@missionarylunch.com` | `6UETYr1xpb7P` |
| COORDENADOR | `coord.demo@igreja.com` | `Demo@2026` |

Além de famílias, missionários e almoços, o seed cria uma **troca de P-Day por transferência** em uma semana futura (segunda liberada e quarta bloqueada), para demonstrar o recurso de exceções no calendário.

> Alterne as senhas em produção. O código do seed fica em `apps/api/prisma/seed.ts`.

A documentação interativa da API fica em **http://localhost:3000/api/docs**.

### 4. Subir o frontend

```bash
cd apps/web
npm install
npm run dev               # http://localhost:5173
```

> Por padrão o frontend consome `http://localhost:3000/api`. Para apontar para outro endereço, defina `VITE_API_URL`.

---

## 🧪 Scripts úteis

| App | Comando | Descrição |
|---|---|---|
| api | `npm run start:dev` | Sobe em watch mode |
| api | `npm run build` | Compila para `dist/` |
| api | `npm run lint` | Lint (ESLint + Prettier) |
| api | `npm test` | Testes unitários (Jest) |
| api | `npx prisma db push` | Sincroniza o schema no banco |
| api | `npm run db:seed` | Seed de demonstração (idempotente) |
| web | `npm run dev` | Sobe em watch mode |
| web | `npm run build` | Build de produção (`dist/`) |
| web | `npm run lint` | Lint (ESLint) |

---

## 🗂️ Estrutura de destaque

**API (`apps/api/src`)**

- `auth/` — login, registro e guard JWT
- `missionaries/` — gestão de missionários (soft delete)
- `families/` — gestão de famílias (soft delete)
- `lunch/` — agendamento de almoços (proteção de P-Day)
- `pday/` — configuração de P-Day e exceções
- `keep-alive/` — cron que mantém o banco ativo
- `prisma/schema.prisma` — modelos de dados

**Web (`apps/web/src`)**

- `pages/` — Dashboard (calendário), Missionários, Famílias, Almoços, P-Day, Login
- `components/` — layout, UI (shadcn) e modal de almoço
- `hooks/` — hooks de dados (TanStack Query)
- `api/` — client Axios com autenticação
- `store/` — estado de autenticação (Zustand)

---

## 🔐 Papéis de acesso

- **ADMIN** — administração completa do sistema
- **COORDINATOR** — gestão do dia a dia (missionários, famílias, almoços)

---

## 🛣️ Roadmap (MVP)

- [x] Aplicação de papéis (ADMIN/COORDINATOR) nas rotas e na interface
- [x] Gestão de usuários (criação, convite, alteração de papel)
- [x] Validações de integridade (almoço duplicado no dia, referências inativas)
- [x] Seed de demonstração com dados realistas
- [x] Tutorial de boas-vindas (onboarding) com replay pelo menu lateral
- [ ] Dashboard com métricas reais e exportação da escala semanal

---

---

## 🔀 Fluxo de desenvolvimento (Git Flow)

O projeto segue o modelo de branching **Git Flow** com **Conventional Commits**:

- `main` — produção; `develop` — integração (branch padrão)
- Features em `feature/*` (a partir de `develop`), releases em `release/*`, hotfixes em `hotfix/*` (a partir de `main`)
- Toda mudança entra por **Pull Request** para `develop`/`main` — nunca commit direto

Regras completas, templates de PR e convenção de commits: **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
