"use server";

import { redirect } from "next/navigation";
import { createSession, getHomeForRole, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });

  redirect(getHomeForRole(user.role));
}

