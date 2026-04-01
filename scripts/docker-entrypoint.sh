#!/bin/sh
set -eu

echo "[entrypoint] Generating Prisma client"
npx prisma generate

echo "[entrypoint] Applying schema with prisma db push"
npx prisma db push

echo "[entrypoint] Starting Serenity"
exec npm start