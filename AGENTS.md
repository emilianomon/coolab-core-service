# Coolab Core Service

## Rules

- Critical: never write tests.
- Use `pnpm`, never npm.
- Keep dependency direction downward: handler -> context/application -> repository -> database.
- Use `@self/*` imports for cross-layer imports.
- Use singleton exports for repositories, contexts, encryptions, and utilities.
- Keep database migrations as raw SQL under `src/database/migrations`.
- Every table type must have matching Zod validation schemas.
- Perform validation in handler layers; never call validation schemas in application layers.
- Call memoization memory directly at the layer that owns the cached workflow; do not add service methods that only proxy memoization calls.
- Never log bearer tokens or encrypted token content.

## Commands

- `pnpm run lint`
- `pnpm run ts`
- `pnpm db:migrate:up`
- `pnpm db:migrate:down`

## Naming

- Implementation files use `{operation}.{resource}.{layer}.ts`.
- Folders expose `index.ts` barrel exports.
- Migration files use `NNNN.action-subject.up.sql` and `NNNN.action-subject.down.sql`.
