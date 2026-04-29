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
  const contacts = clients.flatMap((client) => client.center.users);
  const credentialAlerts = carers.reduce(
    (count, carer) =>
      count + carer.credentials.filter((credential) => credential.status !== "VALID").length,
    0
  );
  const carersWithoutCredentials = carers.filter((carer) => carer.credentials.length === 0).length;
  const carersWithoutAvailability = carers.filter(
    (carer) => carer.availabilityBlocks.length === 0
  ).length;
  const servicesWithoutChecklist = serviceTypes.filter(
    (serviceType) => serviceType.checklistTemplates.length === 0
  ).length;
  const setupChecks = [
    {
      key: "client-network",
      label: "Client center",
      ready: clients.length > 0,
      action: "Create at least one client center linked to Serenity."
    },
    {
      key: "site",
      label: "Site",
      ready: facilities.length > 0,
      action: "Create the site where care will be delivered."
    },
    {
      key: "center-contact",
      label: "Center contact",
      ready: contacts.length > 0,
      action: "Add the person who represents the client center."
    },
    {
      key: "patient",
      label: "Patient",
      ready: recipients.length > 0,
      action: "Add the person receiving care before creating demand."
    },
    {
      key: "care-team",
      label: "Care team",
      ready: carers.length > 0,
      action: "Add carers attached to Serenity."
    },
    {
      key: "availability",
      label: "Availability",
      ready: carers.length > 0 && carersWithoutAvailability === 0,
      action: "Add availability blocks for carers before relying on matching."
    },
    {
      key: "workflow",
      label: "Service workflow",
      ready: serviceTypes.length > 0 && servicesWithoutChecklist === 0,
      action: "Review service types and checklist templates."
    }
  ];
  const setupReady = setupChecks.every((check) => check.ready);

  return {
    provider,
    clients,
    carers,
    serviceTypes,
    setup: {
      ready: setupReady,
      checks: setupChecks,
      blockers: setupChecks.filter((check) => !check.ready),
      nextAction: setupChecks.find((check) => !check.ready)?.action ?? "Provider setup is ready for the first service request."
    },
    stats: {
      clients: clients.length,
      facilities: facilities.length,
      contacts: contacts.length,
      recipients: recipients.length,
      carers: carers.length,
      credentialAlerts,
      carersWithoutCredentials,
      carersWithoutAvailability,
      servicesWithoutChecklist,
      activeOrders
    }
  };
}
