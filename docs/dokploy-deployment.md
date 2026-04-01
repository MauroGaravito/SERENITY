# Dokploy Deployment

## Current architecture

Serenity is currently deployed as:

- one `Next.js` application
- one `PostgreSQL` database

There is no separate backend service yet.
The UI, server actions and Prisma access all live in the same process.

## Recommended deploy mode in Dokploy

Use Dokploy in `Compose` mode with:

- [docker-compose.prod.yml](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/docker-compose.prod.yml)

Do not use:

- [docker-compose.yml](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/docker-compose.yml)

That file is only for local development and starts PostgreSQL only.

## Exact Dokploy changes

In `General`:

- `Provider`: `GitHub`
- `Repository`: `SERENITY`
- `Branch`: `main`
- `Compose Path`: `./docker-compose.prod.yml`

In `Environment`, set these variables:

```env
NODE_ENV=production
PORT=3000
POSTGRES_DB=serenity
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
AUTH_SECRET=serenity-test-secret-2026-dokploy
APP_URL=https://aged-care.downundersolutions.com
CADDY_SHARED_NETWORK=shared_caddy_net
CADDY_UPSTREAM_ALIAS=serenity-aged-care-app
```

Do not set `DATABASE_URL` manually when using `docker-compose.prod.yml`.
The compose file builds it automatically for the app container using the internal `postgres` service.

## Why the database works this way

Inside Dokploy Compose mode:

- the database container is named `postgres`
- the app container connects to it through the internal Docker network
- the app uses this internal host:

```text
postgres:5432
```

That is why [docker-compose.prod.yml](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/docker-compose.prod.yml) sets:

```text
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/serenity?schema=public
```

derived from your `POSTGRES_*` variables.

## Container startup

The production container currently does this on startup:

1. `prisma generate`
2. `prisma db push`
3. `next start`

This is acceptable for the current phase because the schema is still moving fast.
Later, this should move to explicit migrations with `prisma migrate deploy`.

## Caddy note

The current Caddy split between `frontend` and `backend` does not match the app as it exists today.

For the current version of Serenity, the reverse proxy should point all traffic to the single Next.js container through the shared Docker network alias:

```caddy
aged-care.downundersolutions.com {
    encode gzip

    reverse_proxy serenity-aged-care-app:3000

    log {
        output file /var/log/caddy/aged-care.access.log
        format json
    }
}
```

This avoids relying on Dokploy-generated container names, which can change between deploys.

## Why this matters

If you keep the old split:

- `/api/*` will go to a backend service that does not exist in this repo
- Next.js routes and server actions will be routed incorrectly
- auth and page rendering will fail unpredictably

## Build source

Dokploy will build the app container from:

- [Dockerfile](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/Dockerfile)
- [.dockerignore](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/.dockerignore)
