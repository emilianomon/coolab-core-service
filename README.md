# Coolab Core Service

Backend service foundation for Coolab. The first vertical slice is platform user authentication: requests provide an encrypted bearer token, the token is decrypted and validated, the user is resolved from PostgreSQL, and user data is stored in promise context for downstream layers.

## Stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js 24.11.0 |
| Package manager | pnpm |
| Framework | Hono |
| API docs | Hono OpenAPI + Swagger UI |
| Language | TypeScript |
| Validation | Zod |
| Database | PostgreSQL + Kysely |
| Cache | Redis |
| Logging | Winston |
| Tests | Vitest |
| Lint | ESLint flat config |

## Architecture

Request flow:

```text
main -> app -> handlers -> contexts/application -> repositories -> database
```

Support layers are `abstractions`, `consts`, `encryptions`, `exceptions`, `types`, `utils`, and `validation`.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:migrate:up
pnpm start:ts:local
```

The server runs on `HTTP_PORT`, defaulting to `8080` in `.env.example`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run lint` | Run ESLint |
| `pnpm run ts` | Run TypeScript typecheck |
| `pnpm test` | Run Vitest tests when test files exist |
| `pnpm run check` | Run lint and typecheck |
| `pnpm db:migrate:up` | Apply pending SQL migrations |
| `pnpm db:migrate:down` | Roll back the latest SQL migration |
| `pnpm db:create` | Create local database |
| `pnpm db:clear` | Drop local database |

## Environment

See `.env.example` for required values.

Read replica connection strings can be left empty for local development. When `DATABASE_READ_CONNECTION_STRING_1` or `DATABASE_READ_CONNECTION_STRING_2` are configured, read queries use a load-aware pool selection algorithm while writes and transactions continue to use `DATABASE_CONNECTION_STRING`.

## First Endpoint

`GET /platform/v1/users/me`

Headers:

```text
Authorization: Bearer <encrypted-access-token>
```

Behavior:

1. Decrypts the token with `PlatformEncryption`.
2. Validates token content.
3. Loads the user from `UsersRepository`.
4. Memoizes the user lookup in Redis using `memo:user-in-platform-context:{userId}`.
5. Stores user and request metadata in `PlatformContext`.
6. Returns the current user.

OpenAPI docs are available outside production at `/swagger/platform`.
