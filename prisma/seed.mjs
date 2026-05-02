import { randomBytes, scryptSync } from "node:crypto";
import {
  AuditEventType,
  CarerKind,
  ChecklistResult,
  ClosingPeriodStatus,
  CredentialStatus,
  ExpenseType,
  IncidentSeverity,
  OrganizationKind,
  PrismaClient,
  PriorityLevel,
  ReviewOutcome,
  ServiceOrderStatus,
  UserRole,
  VisitStatus
} from "@prisma/client";
import catalogs from "../src/lib/catalogs.json" with { type: "json" };

const prisma = new PrismaClient();
const DEMO_PASSWORD = "SerenityDemo!2026";
const requestedProfile =
  process.argv.find((arg) => arg.startsWith("--profile="))?.split("=")[1] ?? "colombia";

const seedProfiles = {
  colombia: {
    timezone: "America/Bogota",
    provider: {
      legalName: "Serenity Homecare Antioquia SAS",
      displayName: "Serenity Homecare Antioquia"
    },
    blankStart: true,
    admin: {
      email: "admin@serenity.local",
      fullName: "Serenity Admin"
    },
    centers: [
      {
        legalName: "Centro de Cuidado Niquia SAS",
        displayName: "Centro de Cuidado Niquia",
        facility: {
          name: "Sede Niquia",
          addressLine1: "Barrio Niquia",
          suburb: "Niquia",
          state: "Antioquia",
          postalCode: "051051"
        },
        manager: {
          email: "laura@serenity.local",
          fullName: "Laura Garavito"
        }
      }
    ],
    coordinator: {
      email: "mauricio@serenity.local",
      fullName: "Mauricio Garavito"
    },
    reviewer: {
      email: "diana@serenity.local",
      fullName: "Diana Chaverra"
    },
    carers: [
      { name: "Alvaro Ramirez", email: "alvaro@serenity.local" },
      { name: "Gabriel Ramirez", email: "gabriel@serenity.local" },
      { name: "Gloria Palacio", email: "gloria@serenity.local" }
    ],
    recipients: [{ firstName: "Rosalba", lastName: "" }],
    auditSummaries: {
      orderOneCreated: "Provider created SR-2401 for Centro de Cuidado Niquia.",
      visitOneAssigned: "Morning personal care visit assigned to Gabriel Ramirez.",
      orderTwoCreated: "Provider created SR-2402 for Centro de Cuidado Cabanas."
    },
    credentialSlug: "gabriel"
  },
  australia: {
    timezone: "Australia/Sydney",
    provider: {
      legalName: "Serenity Care Partners Pty Ltd",
      displayName: "Serenity Care Partners"
    },
    admin: {
      email: "admin@serenity.local",
      fullName: "Serenity Admin"
    },
    centers: [
      {
        legalName: "Harbour View Care Ltd",
        displayName: "Harbour View Care",
        facility: {
          name: "Bondi Homecare North",
          addressLine1: "10 Campbell Parade",
          suburb: "Bondi",
          state: "NSW",
          postalCode: "2026"
        },
        manager: {
          email: "harbour.manager@serenity.local",
          fullName: "Priya Shah"
        }
      },
      {
        legalName: "Evergreen Support Services Ltd",
        displayName: "Evergreen Support Services",
        facility: {
          name: "Inner West Community",
          addressLine1: "155 Norton Street",
          suburb: "Leichhardt",
          state: "NSW",
          postalCode: "2040"
        },
        manager: {
          email: "evergreen.manager@serenity.local",
          fullName: "Mason Lee"
        }
      },
      {
        legalName: "BlueWattle Homecare Ltd",
        displayName: "BlueWattle Homecare",
        facility: {
          name: "South Sydney Outreach",
          addressLine1: "88 Botany Road",
          suburb: "Alexandria",
          state: "NSW",
          postalCode: "2015"
        },
        manager: {
          email: "bluewattle.manager@serenity.local",
          fullName: "Hannah Price"
        }
      }
    ],
    coordinator: {
      email: "coordination@serenity.local",
      fullName: "Alex Morgan"
    },
    reviewer: {
      email: "review@serenity.local",
      fullName: "Diana Cole"
    },
    carers: [
      { name: "Sofia Bennett", email: "sofia@serenity.local" },
      { name: "Liam Ortega", email: "liam@serenity.local" },
      { name: "Anika Perera", email: "anika@serenity.local" },
      { name: "Emily Tran", email: "emily@serenity.local" },
      { name: "Noah Rossi", email: "noah@serenity.local" },
      { name: "Grace Walker", email: "grace@serenity.local" },
      { name: "Daniel Kim", email: "daniel@serenity.local" }
    ],
    recipients: [
      { firstName: "Maria", lastName: "Thompson" },
      { firstName: "George", lastName: "Hill" },
      { firstName: "Elaine", lastName: "Cooper" }
    ],
    auditSummaries: {
      orderOneCreated: "Provider created SR-2401 for Harbour View Care.",
      visitOneAssigned: "Morning personal care visit assigned to Liam Ortega.",
      orderTwoCreated: "Provider created SR-2402 for Evergreen Support Services."
    },
    credentialSlug: "liam"
  }
};

const seedProfile = seedProfiles[requestedProfile];

if (!seedProfile) {
  throw new Error(`Unknown seed profile "${requestedProfile}". Use colombia or australia.`);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function resetDatabase() {
  await prisma.auditEvent.deleteMany();
  await prisma.exportJobAttempt.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.visitSettlement.deleteMany();
  await prisma.closingPeriod.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.review.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.visitChecklistItem.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.careRecipient.deleteMany();
  await prisma.providerClient.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.carer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  await resetDatabase();

  const provider = await prisma.organization.create({
    data: {
      kind: OrganizationKind.PROVIDER,
      legalName: seedProfile.provider.legalName,
      displayName: seedProfile.provider.displayName,
      timezone: seedProfile.timezone
    }
  });

  const centerWorkspaces = [];

  for (const center of seedProfile.centers) {
    const organization = await prisma.organization.create({
      data: {
        kind: OrganizationKind.CENTER,
        legalName: center.legalName,
        displayName: center.displayName,
        timezone: seedProfile.timezone
      }
    });

    const facility = await prisma.facility.create({
      data: {
        organizationId: organization.id,
        name: center.facility.name,
        addressLine1: center.facility.addressLine1,
        suburb: center.facility.suburb,
        state: center.facility.state,
        postalCode: center.facility.postalCode,
        timezone: seedProfile.timezone
      }
    });

    await prisma.providerClient.create({
      data: {
        providerId: provider.id,
        centerId: organization.id
      }
    });

    centerWorkspaces.push({ organization, facility, manager: center.manager });
  }

  const harbourView = centerWorkspaces[0].organization;
  const evergreen = centerWorkspaces[1]?.organization;
  const blueWattle = centerWorkspaces[2]?.organization;
  const bondiFacility = centerWorkspaces[0].facility;
  const innerWestFacility = centerWorkspaces[1]?.facility;
  const southSydneyFacility = centerWorkspaces[2]?.facility;

  async function createUser({ organizationId, email, fullName, role }) {
    return prisma.user.create({
      data: {
        organizationId,
        email: normalizeEmail(email),
        passwordHash: hashPassword(DEMO_PASSWORD),
        fullName,
        role
      }
    });
  }

  const coordinator = await createUser({
    organizationId: provider.id,
    email: seedProfile.coordinator.email,
    fullName: seedProfile.coordinator.fullName,
    role: UserRole.PROVIDER_COORDINATOR
  });

  const admin = await createUser({
    organizationId: provider.id,
    email: seedProfile.admin.email,
    fullName: seedProfile.admin.fullName,
    role: UserRole.PLATFORM_ADMIN
  });

  const reviewer = await createUser({
    organizationId: provider.id,
    email: seedProfile.reviewer.email,
    fullName: seedProfile.reviewer.fullName,
    role: UserRole.PROVIDER_REVIEWER
  });

  await Promise.all(
    centerWorkspaces.map((workspace) =>
      createUser({
        organizationId: workspace.organization.id,
        email: workspace.manager.email,
        fullName: workspace.manager.fullName,
        role: UserRole.CENTER_MANAGER
      })
    )
  );

  async function createCarer(data) {
    const user = await createUser({
      organizationId: provider.id,
      email: data.email,
      fullName: data.name,
      role: UserRole.CARER
    });

    const [firstName, ...rest] = data.name.split(" ");
    const lastName = rest.join(" ");

    return prisma.carer.create({
      data: {
        providerId: provider.id,
        ownerUserId: user.id,
        kind: CarerKind.INDEPENDENT,
        firstName,
        lastName,
        phone: data.phone,
        email: normalizeEmail(data.email),
        primaryLanguage: data.language,
        businessName: `${data.name} Care Services`,
        abnOrTaxId: data.taxId,
        availabilityNote: data.availability,
        rating: data.rating
      }
    });
  }

  const carerDefaults = [
    {
      phone: "+61 400 111 111",
      language: "English",
      taxId: "51884400111",
      availability: "Available Thu-Fri mornings",
      rating: 4.9
    },
    {
      phone: "+61 400 111 112",
      language: "English",
      taxId: "51884400112",
      availability: "Available Mon-Fri mornings",
      rating: 4.7
    },
    {
      phone: "+61 400 111 113",
      language: "English",
      taxId: "51884400113",
      availability: "Available Thu mornings",
      rating: 4.8
    },
    {
      phone: "+61 400 111 114",
      language: "English",
      taxId: "51884400114",
      availability: "Available Tue-Wed day shifts",
      rating: 4.8
    },
    {
      phone: "+61 400 111 115",
      language: "English",
      taxId: "51884400115",
      availability: "Available Tue day shifts",
      rating: 4.6
    },
    {
      phone: "+61 400 111 116",
      language: "English",
      taxId: "51884400116",
      availability: "Available Sat overnight",
      rating: 4.9
    },
    {
      phone: "+61 400 111 117",
      language: "English",
      taxId: "51884400117",
      availability: "Available Sat-Sun overnight",
      rating: 4.5
    }
  ];

  const seededCarers = [];
  for (const [index, carer] of seedProfile.carers.entries()) {
    seededCarers.push(
      await createCarer({
        name: carer.name,
        email: carer.email,
        ...carerDefaults[index]
      })
    );
  }

  const [sofia, liam, anika, emily, noah, grace, daniel] = seededCarers;

  async function addCredential(carerId, name, expiresAt, options = {}) {
    await prisma.credential.create({
      data: {
        carerId,
        code: name.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
        name,
        status: options.status ?? CredentialStatus.VALID,
        issuedAt: options.issuedAt ?? new Date("2025-01-01T00:00:00.000Z"),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        documentUrl: options.documentUrl ?? null
      }
    });
  }

  const credentialMap = [
    [sofia.id, ["Domestic cleaning", "Meal preparation", "Manual handling", "Personal hygiene support"]],
    [liam.id, ["Personal hygiene support", "Manual handling", "Medication prompt", "Meal preparation"]],
    [anika.id, ["Personal hygiene support", "Manual handling", "Medication prompt", "Social engagement"]],
    [emily?.id, ["Transport escort", "Community participation", "Social engagement"]],
    [noah?.id, ["Transport escort", "Community participation", "Domestic cleaning"]],
    [grace?.id, ["Social engagement", "Medication prompt", "Meal preparation", "Manual handling"]],
    [daniel?.id, ["Social engagement", "Medication prompt", "Community participation"]]
  ].filter(([carerId]) => carerId);

  for (const [carerId, credentials] of credentialMap) {
    for (const name of credentials) {
      await addCredential(carerId, name, "2027-12-31T00:00:00.000Z");
    }
  }

  await addCredential(liam.id, "NDIS Worker Screening", "2026-05-08T00:00:00.000Z", {
    documentUrl: `manual://credentials/${seedProfile.credentialSlug}-ndis-worker-screening.pdf`
  });
  await addCredential(liam.id, "First Aid Certificate", "2027-02-01T00:00:00.000Z", {
    status: CredentialStatus.PENDING,
    documentUrl: `manual://credentials/${seedProfile.credentialSlug}-first-aid-certificate.pdf`
  });
  await addCredential(liam.id, "Police Check", "2026-04-01T00:00:00.000Z", {
    status: CredentialStatus.EXPIRED,
    documentUrl: `manual://credentials/${seedProfile.credentialSlug}-police-check.pdf`
  });

  for (const [index, carer] of [sofia, anika, emily, noah, grace, daniel].filter(Boolean).entries()) {
    await prisma.availabilityBlock.create({
      data: {
        carerId: carer.id,
        startsAt: new Date(`2026-04-0${(index % 5) + 1}T06:00:00.000Z`),
        endsAt: new Date(`2026-04-0${(index % 5) + 1}T18:00:00.000Z`),
        isWorking: true
      }
    });
  }

  for (const block of [
    {
      startsAt: "2026-04-05T21:00:00.000Z",
      endsAt: "2026-04-05T23:00:00.000Z",
      isWorking: true
    },
    {
      startsAt: "2026-04-13T20:30:00.000Z",
      endsAt: "2026-04-13T23:30:00.000Z",
      isWorking: true
    },
    {
      startsAt: "2026-04-14T20:30:00.000Z",
      endsAt: "2026-04-14T23:30:00.000Z",
      isWorking: true
    },
    {
      startsAt: "2026-04-15T03:00:00.000Z",
      endsAt: "2026-04-15T06:00:00.000Z",
      isWorking: false
    }
  ]) {
    await prisma.availabilityBlock.create({
      data: {
        carerId: liam.id,
        startsAt: new Date(block.startsAt),
        endsAt: new Date(block.endsAt),
        isWorking: block.isWorking
      }
    });
  }

  const maria = await prisma.careRecipient.create({
    data: {
      facilityId: bondiFacility.id,
      externalRef: "HV-1001",
      firstName: seedProfile.recipients[0].firstName,
      lastName: seedProfile.recipients[0].lastName,
      notes: "AM support plan with medication prompt"
    }
  });

  const george =
    seedProfile.recipients[1] && innerWestFacility
      ? await prisma.careRecipient.create({
          data: {
            facilityId: innerWestFacility.id,
            externalRef: "EV-1002",
            firstName: seedProfile.recipients[1].firstName,
            lastName: seedProfile.recipients[1].lastName,
            notes: "Community transport with appointment escort"
          }
        })
      : null;

  const elaine =
    seedProfile.recipients[2] && southSydneyFacility
      ? await prisma.careRecipient.create({
          data: {
            facilityId: southSydneyFacility.id,
            externalRef: "BW-1003",
            firstName: seedProfile.recipients[2].firstName,
            lastName: seedProfile.recipients[2].lastName,
            notes: "Overnight respite with safety checks"
          }
        })
      : null;

  const [domesticAssistanceType, communityAccessType, personalCareType, companionshipType] =
    await Promise.all(
      catalogs.serviceTypes.map((serviceType) =>
        prisma.serviceType.create({
          data: serviceType
        })
      )
    );

  async function createChecklist(serviceTypeId, name, labels) {
    return prisma.checklistTemplate.create({
      data: {
        serviceTypeId,
        name,
        version: 1,
        items: {
          create: labels.map((label, index) => ({
            label,
            sortOrder: index + 1,
            isRequired: true
          }))
        }
      },
      include: { items: true }
    });
  }

  await createChecklist(domesticAssistanceType.id, "Domestic assistance", [
    "Cleaning completed",
    "Meal prep completed",
    "Home left safe and tidy"
  ]);
  const communityTemplate = await createChecklist(communityAccessType.id, "Community access", [
    "Escort completed",
    "Community activity completed",
    "Return handoff completed"
  ]);
  const personalTemplate = await createChecklist(personalCareType.id, "Personal care", [
    "Personal hygiene completed",
    "Manual handling completed safely",
    "Medication prompt recorded"
  ]);
  await createChecklist(companionshipType.id, "Companionship", [
    "Engagement activity completed",
    "Mood and participation noted",
    "Handover note captured"
  ]);

  if (seedProfile.blankStart) {
    console.log("Seed complete:", {
      provider: provider.displayName,
      admin: admin.fullName,
      coordinator: coordinator.fullName,
      reviewer: reviewer.fullName,
      profile: requestedProfile,
      demoPassword: DEMO_PASSWORD,
      centers: centerWorkspaces.length,
      recipients: 1,
      carers: seedProfile.carers.length,
      orders: 0,
      visits: 0
    });
    return;
  }

  const orderOne = await prisma.serviceOrder.create({
    data: {
      code: "SR-2401",
      centerId: harbourView.id,
      providerId: provider.id,
      recipientId: maria.id,
      facilityId: bondiFacility.id,
      serviceTypeId: personalCareType.id,
      status: ServiceOrderStatus.PARTIALLY_ASSIGNED,
      priority: PriorityLevel.HIGH,
      title: "Morning personal care support",
      instructions: "AM hygiene routine, medication prompt and breakfast setup before family handoff.",
      coordinatorNotes: "Existing carer unavailable on Thursdays. Replacement coverage still open.",
      requiredSkills: ["Personal hygiene support", "Manual handling", "Medication prompt"],
      requiredLanguage: "English",
      plannedDurationMin: 120,
      startsOn: new Date("2026-04-03T07:00:00.000Z"),
      endsOn: new Date("2026-04-30T09:00:00.000Z"),
      recurrenceRule: "Mon-Fri, 07:00-09:00"
    }
  });

  const orderTwo = await prisma.serviceOrder.create({
    data: {
      code: "SR-2402",
      centerId: evergreen.id,
      providerId: provider.id,
      recipientId: george.id,
      facilityId: innerWestFacility.id,
      serviceTypeId: communityAccessType.id,
      status: ServiceOrderStatus.ACTIVE,
      priority: PriorityLevel.MEDIUM,
      title: "Community access and shopping support",
      instructions: "Escort recipient to local shops, support participation and return with handoff notes.",
      coordinatorNotes: "Shopping duration varies by queue times. Watch actual time vs planned time.",
      requiredSkills: ["Transport escort", "Community participation"],
      plannedDurationMin: 150,
      startsOn: new Date("2026-04-01T10:30:00.000Z"),
      recurrenceRule: "Weekly, Tuesdays 10:30-13:00"
    }
  });

  const orderThree = await prisma.serviceOrder.create({
    data: {
      code: "SR-2403",
      centerId: blueWattle.id,
      providerId: provider.id,
      recipientId: elaine.id,
      facilityId: southSydneyFacility.id,
      serviceTypeId: companionshipType.id,
      status: ServiceOrderStatus.OPEN,
      priority: PriorityLevel.CRITICAL,
      title: "Evening companionship coverage",
      instructions: "Provide evening companionship, light meal support and medication prompt before sleep routine.",
      coordinatorNotes: "Two carers declined due to evening duration. Escalation required before noon.",
      requiredSkills: ["Social engagement", "Meal preparation", "Medication prompt"],
      requiredLanguage: "English",
      plannedDurationMin: 180,
      startsOn: new Date("2026-04-05T16:00:00.000Z"),
      endsOn: new Date("2026-04-05T19:00:00.000Z"),
      recurrenceRule: "Sat-Sun, 16:00-19:00"
    }
  });

  const visitOne = await prisma.visit.create({
    data: {
      serviceOrderId: orderOne.id,
      assignedCarerId: liam.id,
      status: VisitStatus.APPROVED,
      scheduledStart: new Date("2026-04-02T20:00:00.000Z"),
      scheduledEnd: new Date("2026-04-02T22:00:00.000Z"),
      actualStart: new Date("2026-04-02T20:03:00.000Z"),
      actualEnd: new Date("2026-04-02T21:58:00.000Z"),
      exceptionReason: "Visit completed on time, no issues reported."
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: orderOne.id,
      assignedCarerId: liam.id,
      status: VisitStatus.CONFIRMED,
      scheduledStart: new Date("2026-04-13T20:30:00.000Z"),
      scheduledEnd: new Date("2026-04-13T22:30:00.000Z"),
      exceptionReason: "Demo execution visit ready for Liam to start from the carer workspace."
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: orderOne.id,
      status: VisitStatus.SCHEDULED,
      scheduledStart: new Date("2026-04-14T20:00:00.000Z"),
      scheduledEnd: new Date("2026-04-14T22:00:00.000Z"),
      exceptionReason: "Replacement required before 18:00 today."
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: orderOne.id,
      assignedCarerId: sofia.id,
      status: VisitStatus.CANCELLED,
      scheduledStart: new Date("2026-04-15T20:00:00.000Z"),
      scheduledEnd: new Date("2026-04-15T22:00:00.000Z"),
      exceptionReason: "Carer illness reported. Replacement decision pending."
    }
  });

  const visitThree = await prisma.visit.create({
    data: {
      serviceOrderId: orderTwo.id,
      assignedCarerId: emily.id,
      status: VisitStatus.UNDER_REVIEW,
      scheduledStart: new Date("2026-04-01T23:30:00.000Z"),
      scheduledEnd: new Date("2026-04-02T02:00:00.000Z"),
      actualStart: new Date("2026-04-01T23:32:00.000Z"),
      actualEnd: new Date("2026-04-02T02:25:00.000Z"),
      exceptionReason: "Appointment delayed by clinic. Arrival back 25 minutes later than planned."
    }
  });

  const visitFour = await prisma.visit.create({
    data: {
      serviceOrderId: orderTwo.id,
      assignedCarerId: emily.id,
      status: VisitStatus.APPROVED,
      scheduledStart: new Date("2026-04-08T00:30:00.000Z"),
      scheduledEnd: new Date("2026-04-08T03:00:00.000Z"),
      actualStart: new Date("2026-04-08T00:32:00.000Z"),
      actualEnd: new Date("2026-04-08T02:54:00.000Z"),
      exceptionReason: "Community access visit approved and ready for sync demo."
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: orderThree.id,
      status: VisitStatus.SCHEDULED,
      scheduledStart: new Date("2026-04-05T10:00:00.000Z"),
      scheduledEnd: new Date("2026-04-05T20:00:00.000Z"),
      exceptionReason: "Not assigned yet."
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: orderThree.id,
      assignedCarerId: grace.id,
      status: VisitStatus.NO_SHOW,
      scheduledStart: new Date("2026-04-12T06:00:00.000Z"),
      scheduledEnd: new Date("2026-04-12T09:00:00.000Z"),
      exceptionReason: "Assigned carer did not arrive. Escalation and replacement needed."
    }
  });

  for (const item of personalTemplate.items) {
    await prisma.visitChecklistItem.create({
      data: {
        visitId: visitOne.id,
        templateItemId: item.id,
        result: ChecklistResult.PASS,
        note: "Completed"
      }
    });
  }

  for (const item of communityTemplate.items) {
    await prisma.visitChecklistItem.create({
      data: {
        visitId: visitThree.id,
        templateItemId: item.id,
        result: ChecklistResult.PASS,
        note: "Completed"
      }
    });
  }

  for (const item of communityTemplate.items) {
    await prisma.visitChecklistItem.create({
      data: {
        visitId: visitFour.id,
        templateItemId: item.id,
        result: ChecklistResult.PASS,
        note: "Completed"
      }
    });
  }

  const liamUser = await prisma.user.findUniqueOrThrow({ where: { email: seedProfile.carers[1].email } });
  const emilyUser = await prisma.user.findUniqueOrThrow({ where: { email: seedProfile.carers[3].email } });

  for (const fileUrl of [
    "https://example.com/evidence/visit-001-photo-1.jpg",
    "https://example.com/evidence/visit-001-photo-2.jpg",
    "https://example.com/evidence/visit-001-checklist.pdf",
    "https://example.com/evidence/visit-001-signoff.jpg"
  ]) {
    await prisma.evidence.create({
      data: {
        visitId: visitOne.id,
        uploadedById: liamUser.id,
        kind: "photo",
        fileUrl,
        capturedAt: new Date("2026-04-02T21:00:00.000Z")
      }
    });
  }

  for (const fileUrl of [
    "https://example.com/evidence/visit-003-photo-1.jpg",
    "https://example.com/evidence/visit-003-checklist.pdf",
    "https://example.com/evidence/visit-003-signoff.jpg"
  ]) {
    await prisma.evidence.create({
      data: {
        visitId: visitThree.id,
        uploadedById: emilyUser.id,
        kind: "photo",
        fileUrl,
        capturedAt: new Date("2026-04-02T01:40:00.000Z")
      }
    });
  }

  await prisma.incident.create({
    data: {
      visitId: visitThree.id,
      category: "Delay",
      severity: IncidentSeverity.MEDIUM,
      summary: "Shopping trip finished later than planned due to queues.",
      occurredAt: new Date("2026-04-02T01:30:00.000Z")
    }
  });

  await prisma.review.create({
    data: {
      visitId: visitOne.id,
      reviewerId: reviewer.id,
      outcome: ReviewOutcome.APPROVED,
      notes: "Evidence complete and checklist aligned.",
      reviewedAt: new Date("2026-04-02T23:10:00.000Z")
    }
  });

  await prisma.expense.create({
    data: {
      visitId: visitOne.id,
      carerId: liam.id,
      type: ExpenseType.MILEAGE,
      amountCents: 1800,
      currency: "AUD",
      note: "Local travel for personal care visit"
    }
  });

  const closingPeriod = await prisma.closingPeriod.create({
    data: {
      providerId: provider.id,
      label: "Apr 2026 - Week 1",
      startsAt: new Date("2026-03-30T00:00:00.000Z"),
      endsAt: new Date("2026-04-05T23:59:59.000Z"),
      status: ClosingPeriodStatus.OPEN
    }
  });

  await prisma.visitSettlement.create({
    data: {
      closingPeriodId: closingPeriod.id,
      visitId: visitOne.id,
      approvedMinutes: 118,
      billableCents: 16500,
      payableCents: 10400
    }
  });

  const closingPeriodTwo = await prisma.closingPeriod.create({
    data: {
      providerId: provider.id,
      label: "Apr 2026 - Week 2",
      startsAt: new Date("2026-04-06T00:00:00.000Z"),
      endsAt: new Date("2026-04-12T23:59:59.000Z"),
      status: ClosingPeriodStatus.LOCKED
    }
  });

  await prisma.visitSettlement.create({
    data: {
      closingPeriodId: closingPeriodTwo.id,
      visitId: visitFour.id,
      approvedMinutes: 142,
      billableCents: 17200,
      payableCents: 11100
    }
  });

  const manualExportJob = await prisma.exportJob.create({
    data: {
      closingPeriodId: closingPeriodTwo.id,
      targetSystem: "manual_handoff",
      format: "json",
      status: "SUCCEEDED",
      externalStatus: "ACKNOWLEDGED",
      attemptCount: 1,
      externalReference: `MANUAL-${closingPeriodTwo.id.slice(-6).toUpperCase()}`,
      payload: {
        exportBatchId: `serenity-${closingPeriodTwo.id}`,
        targetSystem: "manual_handoff",
        totals: {
          visits: 1,
          approvedMinutes: 142,
          billableCents: 17200,
          payableCents: 11100,
          expenseCents: 0
        }
      },
      queuedAt: new Date("2026-04-12T02:00:00.000Z"),
      nextAttemptAt: null,
      lastAttemptAt: new Date("2026-04-12T02:05:00.000Z"),
      completedAt: new Date("2026-04-12T02:06:00.000Z"),
      acknowledgedAt: new Date("2026-04-12T02:06:00.000Z"),
      connectorCode: "MANUAL_REGISTERED",
      connectorMessage: "Manual handoff register completed and acknowledged immediately."
    }
  });

  const payrollExportJob = await prisma.exportJob.create({
    data: {
      closingPeriodId: closingPeriodTwo.id,
      targetSystem: "mock_payroll_gateway",
      format: "json",
      status: "SUCCEEDED",
      externalStatus: "SENT",
      attemptCount: 1,
      externalReference: `MPG-${closingPeriodTwo.id.slice(-6).toUpperCase()}`,
      payload: {
        exportBatchId: `serenity-${closingPeriodTwo.id}`,
        targetSystem: "mock_payroll_gateway",
        totals: {
          visits: 1,
          approvedMinutes: 142,
          billableCents: 17200,
          payableCents: 11100,
          expenseCents: 0
        }
      },
      queuedAt: new Date("2026-04-12T02:10:00.000Z"),
      nextAttemptAt: new Date("2026-04-12T02:21:00.000Z"),
      lastAttemptAt: new Date("2026-04-12T02:15:00.000Z"),
      completedAt: new Date("2026-04-12T02:16:00.000Z"),
      connectorCode: "PAYLOAD_ACCEPTED",
      connectorMessage: "Payload accepted by connector and awaiting external acknowledgement."
    }
  });

  const xeroExportJob = await prisma.exportJob.create({
    data: {
      closingPeriodId: closingPeriodTwo.id,
      targetSystem: "xero_custom_connection",
      format: "json",
      status: "SUCCEEDED",
      externalStatus: "ACKNOWLEDGED",
      attemptCount: 1,
      externalReference: `XERO-${closingPeriodTwo.id.slice(-6).toUpperCase()}-SANDBOX`,
      payload: {
        exportBatchId: `serenity-${closingPeriodTwo.id}`,
        targetSystem: "xero_custom_connection",
        totals: {
          visits: 1,
          approvedMinutes: 142,
          billableCents: 17200,
          payableCents: 11100,
          expenseCents: 0
        }
      },
      queuedAt: new Date("2026-04-12T02:20:00.000Z"),
      nextAttemptAt: null,
      lastAttemptAt: new Date("2026-04-12T02:22:00.000Z"),
      completedAt: new Date("2026-04-12T02:23:00.000Z"),
      acknowledgedAt: new Date("2026-04-12T02:23:00.000Z"),
      connectorCode: "XERO_SANDBOX_ACK",
      connectorMessage: "Xero custom connection adapter acknowledged the payload in sandbox mode."
    }
  });

  const failedExportJob = await prisma.exportJob.create({
    data: {
      closingPeriodId: closingPeriodTwo.id,
      targetSystem: "qa_failure_simulation",
      format: "json",
      status: "FAILED",
      externalStatus: "REJECTED",
      attemptCount: 1,
      lastError: "Mock connector rejected the payload. Review mapping and retry.",
      payload: {
        exportBatchId: `serenity-${closingPeriodTwo.id}`,
        targetSystem: "qa_failure_simulation"
      },
      queuedAt: new Date("2026-04-12T02:40:00.000Z"),
      nextAttemptAt: null,
      lastAttemptAt: new Date("2026-04-12T02:45:00.000Z"),
      connectorCode: "QA_CONNECTOR_REJECTED",
      connectorMessage: "Mock connector rejected the payload during delivery."
    }
  });

  await prisma.exportJobAttempt.createMany({
    data: [
      {
        exportJobId: manualExportJob.id,
        kind: "DELIVERY",
        result: "ACKNOWLEDGED",
        startedAt: new Date("2026-04-12T02:05:00.000Z"),
        completedAt: new Date("2026-04-12T02:06:00.000Z"),
        connectorCode: "MANUAL_REGISTERED",
        connectorMessage: "Manual handoff register completed and acknowledged immediately.",
        responsePayload: {
          jobStatus: "acknowledged",
          connectorCode: "MANUAL_REGISTERED"
        }
      },
      {
        exportJobId: payrollExportJob.id,
        kind: "DELIVERY",
        result: "SENT",
        startedAt: new Date("2026-04-12T02:15:00.000Z"),
        completedAt: new Date("2026-04-12T02:16:00.000Z"),
        connectorCode: "PAYLOAD_ACCEPTED",
        connectorMessage: "Payload accepted by connector and awaiting external acknowledgement.",
        responsePayload: {
          jobStatus: "sent",
          connectorCode: "PAYLOAD_ACCEPTED"
        }
      },
      {
        exportJobId: xeroExportJob.id,
        kind: "DELIVERY",
        result: "ACKNOWLEDGED",
        startedAt: new Date("2026-04-12T02:22:00.000Z"),
        completedAt: new Date("2026-04-12T02:23:00.000Z"),
        connectorCode: "XERO_SANDBOX_ACK",
        connectorMessage: "Xero custom connection adapter acknowledged the payload in sandbox mode.",
        responsePayload: {
          jobStatus: "acknowledged",
          connectorCode: "XERO_SANDBOX_ACK"
        }
      },
      {
        exportJobId: failedExportJob.id,
        kind: "DELIVERY",
        result: "FAILED",
        startedAt: new Date("2026-04-12T02:45:00.000Z"),
        completedAt: new Date("2026-04-12T02:45:30.000Z"),
        connectorCode: "QA_CONNECTOR_REJECTED",
        connectorMessage: "Mock connector rejected the payload during delivery.",
        errorMessage: "Mock connector rejected the payload. Review mapping and retry.",
        responsePayload: {
          jobStatus: "failed",
          connectorCode: "QA_CONNECTOR_REJECTED"
        }
      }
    ]
  });

  await prisma.auditEvent.createMany({
    data: [
      {
        organizationId: harbourView.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderOne.id,
        type: AuditEventType.ORDER_CREATED,
        summary: seedProfile.auditSummaries.orderOneCreated
      },
      {
        organizationId: provider.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderOne.id,
        visitId: visitOne.id,
        type: AuditEventType.VISIT_ASSIGNED,
        summary: seedProfile.auditSummaries.visitOneAssigned
      },
      {
        organizationId: provider.id,
        actorUserId: reviewer.id,
        serviceOrderId: orderOne.id,
        visitId: visitOne.id,
        type: AuditEventType.VISIT_REVIEWED,
        summary: "Visit approved after evidence and checklist review."
      },
      {
        organizationId: evergreen.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderTwo.id,
        type: AuditEventType.ORDER_CREATED,
        summary: seedProfile.auditSummaries.orderTwoCreated
      },
      {
        organizationId: provider.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderTwo.id,
        visitId: visitThree.id,
        type: AuditEventType.VISIT_STATUS_CHANGED,
        summary: "Transport escort visit moved to under review."
      },
      {
        organizationId: blueWattle.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderThree.id,
        type: AuditEventType.ORDER_CREATED,
        summary: "Critical overnight respite request created and awaiting coverage."
      }
    ]
  });

  console.log("Seed complete:", {
    provider: provider.displayName,
    coordinator: coordinator.fullName,
    reviewer: reviewer.fullName,
    profile: requestedProfile,
    demoPassword: DEMO_PASSWORD,
    orders: 3,
    visits: 7
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

