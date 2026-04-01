# Security Notes

## Current posture

- `npm audit`: clean as of 2026-04-01
- local database runs in Docker only
- no npm Git dependencies are allowed by policy

## Dependency policy

1. Prefer registry packages over Git dependencies.
2. Avoid adding install-time scripts unless strictly necessary.
3. Run `npm audit` after dependency changes.
4. Keep `prisma` and `@prisma/client` on matching versions.
5. Keep the `effect` override unless Prisma ships a fixed transitive dependency in the same supported line.

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
- future auth secrets
- future storage credentials

## Review checklist

Before deploy:

1. `npm audit`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run db:generate`
