"use server";

import { redirect } from "next/navigation";
import { createSession, getHomeForRole, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertLoginAttemptAllowed,
  clearLoginFailures,
  createLoginThrottleKey,
  recordLoginFailure
} from "@/lib/security";

export type LoginFormState = {
  error?: string;
};

function requiredString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = requiredString(formData.get("email")).toLowerCase();
  const password = requiredString(formData.get("password"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const throttleKey = await createLoginThrottleKey(email);

  try {
    await assertLoginAttemptAllowed(throttleKey);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in right now."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      organizationId: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true
    }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await recordLoginFailure(throttleKey);
    return { error: "Invalid email or password." };
  }

  await clearLoginFailures(throttleKey);

  await createSession({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });

  redirect(getHomeForRole(user.role));
}

