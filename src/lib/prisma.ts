import { PrismaClient } from "@prisma/client";

declare global {
  var __serenityPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__serenityPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__serenityPrisma = prisma;
}
