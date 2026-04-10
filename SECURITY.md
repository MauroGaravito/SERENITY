# Security Notes

## Current posture

- server-side session expiry is enforced
- login attempts are throttled and temporarily blocked after repeated failures
- public demo credentials are hidden by default
- local database runs in Docker only
- no npm Git dependencies are allowed by policy

## Active dependency posture

As of 2026-04-10, the project pins these transitive mitigations:

- `effect = 3.20.0`
- `defu = 6.1.7`

These overrides exist because upstream tooling has recently pulled vulnerable transitive packages into otherwise normal application stacks.

## Dependency policy

1. Prefer registry packages over Git dependencies.
2. Avoid adding install-time scripts unless strictly necessary.
3. Run `npm audit` after dependency changes.
4. Keep `prisma` and `@prisma/client` on matching versions.
5. Keep the `effect` and `defu` overrides unless Prisma ships a fixed transitive dependency in the same supported line.

## npm policy

Recommended minimum tooling:

- `node >= 22.15.0`
- `npm >= 11.10.0`

Reason:

- newer npm supports `--allow-git=none`, which hardens installs against Git-based supply-chain paths.

## Safe install commands

### Local development

```bash
npm install
npm audit
```

### CI / Dokploy build container

Use:

```bash
npm ci --allow-git=none
```

Only use `--ignore-scripts` if you have explicitly validated that your full build and Prisma workflow still work without package lifecycle scripts.

## Secrets

Do not commit:

- `.env`
- production database URLs
- npm tokens
- cloud provider credentials

Use environment variables in Dokploy for:

- `DATABASE_URL`
- `AUTH_SECRET`
- future storage credentials

Keep these values strong and rotated:

- `AUTH_SECRET`
- database passwords

## Presentation checklist

Before presenting Serenity to clients:

1. `npm audit`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run db:generate`
6. verify `SHOW_DEMO_CREDENTIALS=false`
7. verify public login does not expose shared credentials
8. verify Dokploy secrets were rotated away from demo defaults
