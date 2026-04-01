# Dokploy Deployment

## Current architecture

Serenity is currently deployed as:

- one `Next.js` application
- one `PostgreSQL` database

There is no separate backend service yet.
The UI, server actions and Prisma access all live in the same process.

## Required environment

Use [.env.dokploy.example](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/.env.dokploy.example) as the base.

Minimum variables:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=postgresql://...`
- `AUTH_SECRET=...`

## Container startup

The production container currently does this on startup:

1. `prisma generate`
2. `prisma db push`
3. `next start`

This is acceptable for the current phase because the schema is still moving fast.
Later, this should move to explicit migrations with `prisma migrate deploy`.

## Caddy note

The current Caddy split between `frontend` and `backend` does not match the app as it exists today.

For the current version of Serenity, the reverse proxy should point all traffic to the single Next.js container:

```caddy
aged-care.downundersolutions.com {
    encode gzip

    reverse_proxy serenity-serenityac-k5y2d4-service3_app-1:3000

    log {
        output file /var/log/caddy/aged-care.access.log
        format json
    }
}
```

## Why this matters

If you keep the old split:

- `/api/*` will go to a backend service that does not exist in this repo
- Next.js routes and server actions will be routed incorrectly
- auth and page rendering will fail unpredictably

## Recommended Dokploy services

Create:

1. `app`
2. `postgres`

Do not create separate `frontend` and `backend` services for this codebase yet.

## Build source

Dokploy can build directly from:

- [Dockerfile](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/Dockerfile)
- [.dockerignore](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/.dockerignore)
