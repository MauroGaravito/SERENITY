import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getAdminWorkspace(providerId: string) {
  noStore();

  const [provider, clients, carers, serviceTypes, activeOrders] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: providerId },
      select: {
        id: true,
        displayName: true,
        legalName: true,
        timezone: true
      }
    }),
    prisma.providerClient.findMany({
      where: { providerId },
      orderBy: {
        center: {
          displayName: "asc"
        }
      },
      select: {
        id: true,
        status: true,
        center: {
          select: {
            id: true,
            displayName: true,
            legalName: true,
            facilities: {
              orderBy: { name: "asc" },
              select: {
                id: true,
                name: true,
                suburb: true,
                state: true,
                recipients: {
                  orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            users: {
              where: { role: "CENTER_MANAGER" },
              orderBy: { fullName: "asc" },
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    }),
    prisma.carer.findMany({
      where: { providerId },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        kind: true,
        phone: true,
        email: true,
        primaryLanguage: true,
        availabilityNote: true,
        isActive: true,
        credentials: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            status: true,
            expiresAt: true
          }
        },
        availabilityBlocks: {
          select: {
            id: true,
            isWorking: true
          }
        }
      }
    }),
    prisma.serviceType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        defaultDurationMin: true,
        checklistTemplates: {
          take: 1,
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            items: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                label: true,
                isRequired: true
              }
            }
          }
        }
      }
    }),
    prisma.serviceOrder.count({
      where: {
        providerId,
        status: {
          notIn: ["CLOSED", "CANCELLED"]
        }
      }
    })
  ]);

  const facilities = clients.flatMap((client) => client.center.facilities);
  const recipients = facilities.flatMap((facility) => facility.recipients);
  const credentialAlerts = carers.reduce(
    (count, carer) =>
      count + carer.credentials.filter((credential) => credential.status !== "VALID").length,
    0
  );

  return {
    provider,
    clients,
    carers,
    serviceTypes,
    stats: {
      clients: clients.length,
      facilities: facilities.length,
      recipients: recipients.length,
      carers: carers.length,
      credentialAlerts,
      activeOrders
    }
  };
}
