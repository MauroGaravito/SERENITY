"use server";

import { CarerKind, OrganizationKind, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ADMIN_ROLES, hashPassword, requireOrganizationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_PASSWORD = "SerenityDemo!2026";

function readRequired(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function requireAdminProviderId() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  return session.organizationId;
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/care-team");
  revalidatePath("/providers/orders");
}

export async function createClientCenter(formData: FormData) {
  const providerId = await requireAdminProviderId();
  const centerName = readRequired(formData, "centerName");
  const facilityName = readRequired(formData, "facilityName");
  const managerName = readRequired(formData, "managerName");
  const managerEmail = normalizeEmail(readRequired(formData, "managerEmail"));
  const suburb = readRequired(formData, "suburb");
  const state = readRequired(formData, "state");

  await prisma.$transaction(async (tx) => {
    const center = await tx.organization.create({
      data: {
        kind: OrganizationKind.CENTER,
        legalName: centerName,
        displayName: centerName,
        timezone: "America/Bogota"
      }
    });

    await tx.providerClient.create({
      data: {
        providerId,
        centerId: center.id
      }
    });

    await tx.facility.create({
      data: {
        organizationId: center.id,
        name: facilityName,
        addressLine1: readRequired(formData, "addressLine1"),
        suburb,
        state,
        postalCode: String(formData.get("postalCode") ?? "").trim() || "000000",
        timezone: "America/Bogota"
      }
    });

    await tx.user.create({
      data: {
        organizationId: center.id,
        email: managerEmail,
        passwordHash: hashPassword(DEMO_PASSWORD),
        fullName: managerName,
        role: UserRole.CENTER_MANAGER
      }
    });
  });

  revalidateAdmin();
}

export async function createCareRecipient(formData: FormData) {
  const providerId = await requireAdminProviderId();
  const facilityId = readRequired(formData, "facilityId");
  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      organization: {
        centerProviders: {
          some: { providerId }
        }
      }
    },
    select: { id: true }
  });

  if (!facility) {
    throw new Error("Facility is not part of this provider client network.");
  }

  await prisma.careRecipient.create({
    data: {
      facilityId,
      firstName: readRequired(formData, "firstName"),
      lastName: String(formData.get("lastName") ?? "").trim(),
      externalRef: String(formData.get("externalRef") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null
    }
  });

  revalidateAdmin();
}

export async function createCareTeamMember(formData: FormData) {
  const providerId = await requireAdminProviderId();
  const firstName = readRequired(formData, "firstName");
  const lastName = readRequired(formData, "lastName");
  const email = normalizeEmail(readRequired(formData, "email"));
  const kind = String(formData.get("kind") ?? "INDEPENDENT");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        organizationId: providerId,
        email,
        passwordHash: hashPassword(DEMO_PASSWORD),
        fullName: `${firstName} ${lastName}`.trim(),
        role: UserRole.CARER
      }
    });

    await tx.carer.create({
      data: {
        providerId,
        ownerUserId: user.id,
        kind: kind === "EMPLOYEE" ? CarerKind.EMPLOYEE : CarerKind.INDEPENDENT,
        firstName,
        lastName,
        phone: readRequired(formData, "phone"),
        email,
        primaryLanguage: String(formData.get("primaryLanguage") ?? "").trim() || null,
        businessName: String(formData.get("businessName") ?? "").trim() || null,
        abnOrTaxId: String(formData.get("taxId") ?? "").trim() || null,
        availabilityNote: String(formData.get("availabilityNote") ?? "").trim() || null,
        rating: 0
      }
    });
  });

  revalidateAdmin();
}
