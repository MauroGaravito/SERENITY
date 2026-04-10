import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 30 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createLoginThrottleKey(email: string) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const userAgent = headerStore.get("user-agent") ?? "";
  const clientIp = forwardedFor.split(",")[0]?.trim() ?? "";

  return sha256(`${email.toLowerCase()}|${clientIp}|${userAgent}`);
}

export async function assertLoginAttemptAllowed(key: string) {
  const throttle = await prisma.loginThrottle.findUnique({
    where: { key }
  });

  if (!throttle) {
    return;
  }

  const now = Date.now();

  if (throttle.blockedUntil && throttle.blockedUntil.getTime() > now) {
    const retryAfterMinutes = Math.ceil((throttle.blockedUntil.getTime() - now) / 60000);
    throw new Error(
      `Too many sign-in attempts. Try again in ${Math.max(retryAfterMinutes, 1)} minute(s).`
    );
  }
}

export async function recordLoginFailure(key: string) {
  const now = new Date();
  const existing = await prisma.loginThrottle.findUnique({
    where: { key }
  });

  if (!existing) {
    await prisma.loginThrottle.create({
      data: {
        key,
        failureCount: 1,
        windowStartedAt: now,
        lastAttemptAt: now
      }
    });
    return;
  }

  const currentWindowAge = now.getTime() - existing.windowStartedAt.getTime();
  const nextFailureCount = currentWindowAge > LOGIN_WINDOW_MS ? 1 : existing.failureCount + 1;
  const shouldBlock = nextFailureCount >= LOGIN_MAX_FAILURES;

  await prisma.loginThrottle.update({
    where: { key },
    data: {
      failureCount: nextFailureCount,
      windowStartedAt: currentWindowAge > LOGIN_WINDOW_MS ? now : existing.windowStartedAt,
      lastAttemptAt: now,
      blockedUntil: shouldBlock ? new Date(now.getTime() + LOGIN_BLOCK_MS) : null
    }
  });
}

export async function clearLoginFailures(key: string) {
  await prisma.loginThrottle.deleteMany({
    where: { key }
  });
}

