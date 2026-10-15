# Missionary Lunch Copilot Instructions

## Repository layout

This is a simple monorepo with independent npm applications; it does **not** use npm workspaces. Install dependencies and run commands from the relevant app directory:

- `apps/api`: NestJS 11 REST API, Prisma 6, and MongoDB.
- `apps/web`: React 19/Vite single-page application using Tailwind CSS, shadcn/ui, TanStack Query, and Zustand.

Node.js 18+ is required (20+ recommended). The API needs MongoDB; local MongoDB must run as a replica set because Prisma's MongoDB connector requires it. Copy `apps/api/.env.example` to `apps/api/.env` and configure `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PORT`.

## Commands

Run these from the indicated directory:

| Directory | Purpose | Command |
| --- | --- | --- |
| `apps/api` | Install dependencies | `npm install` |
| `apps/api` | Generate/synchronize MongoDB collections after schema changes | `npx prisma db push` |
| `apps/api` | Seed idempotent demo data | `npm run db:seed` |
| `apps/api` | Start the API in watch mode | `npm run start:dev` |
| `apps/api` | Build | `npm run build` |
| `apps/api` | Lint and auto-fix | `npm run lint` |
| `apps/api` | Run all unit tests | `npm test` |
| `apps/api` | Run one unit test file | `npm test -- app.controller.spec.ts` |
| `apps/api` | Run e2e tests | `npm run test:e2e` |
| `apps/api` | Run one e2e test file | `npm run test:e2e -- app.e2e-spec.ts` |
| `apps/web` | Install dependencies | `npm install` |
| `apps/web` | Start Vite | `npm run dev` |
| `apps/web` | Build/type-check | `npm run build` |
| `apps/web` | Lint | `npm run lint` |

The API serves every controller beneath `/api` and exposes Swagger at `/api/docs`. The frontend's Axios client defaults to `http://localhost:3000/api`; Vite proxies `/api` to `API_PROXY_TARGET`, whose current fallback is `http://localhost:3009`. Keep those values aligned when changing local development configuration.

## Architecture and data flow

- `apps/api/src/app.module.ts` composes feature modules. `PrismaModule` is global and exposes the shared `PrismaService`; the schema is at `apps/api/src/prisma/schema.prisma`.
- API features follow Nest's controller/service/DTO/module pattern. Controllers expose REST resources, DTOs use class-validator validation, and services own database access and business rules. `main.ts` applies a global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`, so client payloads must match DTOs exactly.
- Authentication is JWT-based. Protected endpoints use `JwtAuthGuard`; user administration additionally applies `RolesGuard` and `@Roles(Role.ADMIN)`. The frontend persists the authenticated user/token in the `missionary-auth` Zustand store, adds the bearer token in `api/client.ts`, redirects to `/login` after a 401, and gates the users route with `RequireRole`. Add authorization in both relevant API controllers and frontend routes/navigation.
- The web app is organized as routes in `App.tsx`, page-level UI in `pages/`, request functions in `api/`, and TanStack Query query/mutation wrappers in `hooks/`. New server-backed UI should follow that chain: typed API helper, matching hook with a stable exported query-key prefix, then invalidate that prefix and show Sonner feedback after mutations. Reuse `createCrudApi` for standard entity CRUD; lunches and P-Day have custom APIs.
- Lunches connect one family with a list of missionary IDs. Prisma/MongoDB does not model the missionary side as a relational field, so `LunchesService` resolves `missionaryIds` manually and returns a `missionaries` array for the UI.

## Domain invariants and conventions

- Families and missionaries are soft-deleted by setting `active: false`; list endpoints default to active records. Do not turn their deletion into a hard delete. Lunch creation and updates reject inactive or missing families and missionaries.
- A lunch is unique per UTC calendar day. `LunchesService` must continue to enforce the duplicate-date and P-Day checks on writes; UI availability/suggestions are convenience only, not the source of truth.
- P-Day uses an effective-dated weekday configuration plus date-specific exceptions. Normalize exact P-Day exception dates to UTC midnight and use UTC day operations when adding or comparing dates. A `blocked: false` exception explicitly releases an otherwise blocked recurring P-Day.
- User-facing UI, API validation messages, issue/PR descriptions, and repository documentation are in Portuguese. Commit messages use English Conventional Commits, e.g. `feat(lunch): add schedule conflict check`.
- Follow Git Flow: work begins from `develop`, feature branches use `feature/*`, and PRs target `develop`; never commit directly to `main` or `develop`. Schema changes require `npx prisma db push` and must be called out in the PR.
