import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "serenity_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const PROVIDER_ROLES = [UserRole.PROVIDER_COORDINATOR, UserRole.PROVIDER_REVIEWER] as const;
const CENTER_ROLES = [UserRole.CENTER_MANAGER] as const;
const CARER_ROLES = [UserRole.CARER] as const;

export { CARER_ROLES, CENTER_ROLES, PROVIDER_ROLES };

export type SessionUser = {
  userId: string;
  organizationId: string | null;
  email: string;
  fullName: string;
  role: UserRole;
};

export type OrganizationSessionUser = SessionUser & {
  organizationId: string;
};

type SessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-dev-auth-secret-change-me";
  }

  throw new Error("AUTH_SECRET is required in production");
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${signValue(value)}`;
}

function decodeSession(cookieValue: string) {
  try {
    const [value, signature] = cookieValue.split(".");

    if (!value || !signature) {
      return null;
    }

    const expectedSignature = signValue(value);
    const providedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const rawPayload = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(rawPayload) as SessionPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, expectedHash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  const providedBuffer = Buffer.from(derivedKey, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function readSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawCookie) {
    return null;
  }

  const decoded = decodeSession(rawCookie);

  if (!decoded) {
    return null;
  }

  if (decoded.expiresAt <= Date.now()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      organizationId: true,
      email: true,
      fullName: true,
      role: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
}

export async function getOptionalSession() {
  return readSessionFromCookie();
}

export function getHomeForRole(role: UserRole) {
  switch (role) {
    case UserRole.PROVIDER_COORDINATOR:
    case UserRole.PROVIDER_REVIEWER:
      return "/providers";
    case UserRole.CENTER_MANAGER:
      return "/centers";
    case UserRole.CARER:
      return "/carers";
    default:
      return "/";
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case UserRole.PROVIDER_COORDINATOR:
      return "Provider coordinator";
    case UserRole.PROVIDER_REVIEWER:
      return "Provider reviewer";
    case UserRole.CENTER_MANAGER:
      return "Center manager";
    case UserRole.CARER:
      return "Independent carer";
    default:
      return "Platform admin";
  }
}

export async function createSession(session: SessionUser) {
  const cookieStore = await cookies();
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    userId: session.userId,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000
  };

  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireUser(allowedRoles?: readonly UserRole[]) {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect(getHomeForRole(session.role));
  }

  return session;
}

export async function requireOrganizationUser(
  allowedRoles: readonly UserRole[]
): Promise<OrganizationSessionUser> {
  const session = await requireUser(allowedRoles);

  if (!session.organizationId) {
    throw new Error("Authenticated user is not linked to an organization");
  }

  return {
    ...session,
    organizationId: session.organizationId
  };
}

export async function redirectAuthenticatedUser() {
  const session = await getOptionalSession();

  if (session) {
    redirect(getHomeForRole(session.role));
  }
}

