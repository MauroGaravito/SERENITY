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
      legalName: "Serenity Care Partners Pty Ltd",
      displayName: "Serenity Care Partners",
      timezone: "Australia/Sydney"
    }
  });

  const harbourView = await prisma.organization.create({
    data: {
      kind: OrganizationKind.CENTER,
      legalName: "Harbour View Care Ltd",
      displayName: "Harbour View Care",
      timezone: "Australia/Sydney"
    }
  });

  const evergreen = await prisma.organization.create({
    data: {
      kind: OrganizationKind.CENTER,
      legalName: "Evergreen Support Services Ltd",
      displayName: "Evergreen Support Services",
      timezone: "Australia/Sydney"
    }
  });

  const blueWattle = await prisma.organization.create({
    data: {
      kind: OrganizationKind.CENTER,
      legalName: "BlueWattle Homecare Ltd",
      displayName: "BlueWattle Homecare",
      timezone: "Australia/Sydney"
    }
  });

  const bondiFacility = await prisma.facility.create({
    data: {
      organizationId: harbourView.id,
      name: "Bondi Homecare North",
      addressLine1: "10 Campbell Parade",
      suburb: "Bondi",
      state: "NSW",
      postalCode: "2026",
      timezone: "Australia/Sydney"
    }
  });

  const innerWestFacility = await prisma.facility.create({
    data: {
      organizationId: evergreen.id,
      name: "Inner West Community",
      addressLine1: "155 Norton Street",
      suburb: "Leichhardt",
      state: "NSW",
      postalCode: "2040",
      timezone: "Australia/Sydney"
    }
  });

  const southSydneyFacility = await prisma.facility.create({
    data: {
      organizationId: blueWattle.id,
      name: "South Sydney Outreach",
      addressLine1: "88 Botany Road",
      suburb: "Alexandria",
      state: "NSW",
      postalCode: "2015",
      timezone: "Australia/Sydney"
    }
  });

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
    email: "coordination@serenity.local",
    fullName: "Alex Morgan",
    role: UserRole.PROVIDER_COORDINATOR
  });

  const reviewer = await createUser({
    organizationId: provider.id,
    email: "review@serenity.local",
    fullName: "Diana Cole",
    role: UserRole.PROVIDER_REVIEWER
  });

  await Promise.all([
    createUser({
      organizationId: harbourView.id,
      email: "harbour.manager@serenity.local",
      fullName: "Priya Shah",
      role: UserRole.CENTER_MANAGER
    }),
    createUser({
      organizationId: evergreen.id,
      email: "evergreen.manager@serenity.local",
      fullName: "Mason Lee",
      role: UserRole.CENTER_MANAGER
    }),
    createUser({
      organizationId: blueWattle.id,
      email: "bluewattle.manager@serenity.local",
      fullName: "Hannah Price",
      role: UserRole.CENTER_MANAGER
    })
  ]);

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

  const sofia = await createCarer({
    name: "Sofia Bennett",
    email: "sofia@serenity.local",
    phone: "+61 400 111 111",
    language: "English",
    taxId: "51884400111",
    availability: "Available Thu-Fri mornings",
    rating: 4.9
  });
  const liam = await createCarer({
    name: "Liam Ortega",
    email: "liam@serenity.local",
    phone: "+61 400 111 112",
    language: "English",
    taxId: "51884400112",
    availability: "Available Mon-Fri mornings",
    rating: 4.7
  });
  const anika = await createCarer({
    name: "Anika Perera",
    email: "anika@serenity.local",
    phone: "+61 400 111 113",
    language: "English",
    taxId: "51884400113",
    availability: "Available Thu mornings",
    rating: 4.8
  });
  const emily = await createCarer({
    name: "Emily Tran",
    email: "emily@serenity.local",
    phone: "+61 400 111 114",
    language: "English",
    taxId: "51884400114",
    availability: "Available Tue-Wed day shifts",
    rating: 4.8
  });
  const noah = await createCarer({
    name: "Noah Rossi",
    email: "noah@serenity.local",
    phone: "+61 400 111 115",
    language: "English",
    taxId: "51884400115",
    availability: "Available Tue day shifts",
    rating: 4.6
  });
  const grace = await createCarer({
    name: "Grace Walker",
    email: "grace@serenity.local",
    phone: "+61 400 111 116",
    language: "English",
    taxId: "51884400116",
    availability: "Available Sat overnight",
    rating: 4.9
  });
  const daniel = await createCarer({
    name: "Daniel Kim",
    email: "daniel@serenity.local",
    phone: "+61 400 111 117",
    language: "English",
    taxId: "51884400117",
    availability: "Available Sat-Sun overnight",
    rating: 4.5
  });

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
    [emily.id, ["Transport escort", "Community participation", "Social engagement"]],
    [noah.id, ["Transport escort", "Community participation", "Domestic cleaning"]],
    [grace.id, ["Social engagement", "Medication prompt", "Meal preparation", "Manual handling"]],
    [daniel.id, ["Social engagement", "Medication prompt", "Community participation"]]
  ];

  for (const [carerId, credentials] of credentialMap) {
    for (const name of credentials) {
      await addCredential(carerId, name, "2027-12-31T00:00:00.000Z");
    }
  }

  await addCredential(liam.id, "NDIS Worker Screening", "2026-05-08T00:00:00.000Z", {
    documentUrl: "manual://credentials/liam-ndis-worker-screening.pdf"
  });
  await addCredential(liam.id, "First Aid Certificate", "2027-02-01T00:00:00.000Z", {
    status: CredentialStatus.PENDING,
    documentUrl: "manual://credentials/liam-first-aid-certificate.pdf"
  });
  await addCredential(liam.id, "Police Check", "2026-04-01T00:00:00.000Z", {
    status: CredentialStatus.EXPIRED,
    documentUrl: "manual://credentials/liam-police-check.pdf"
  });

  for (const [index, carer] of [sofia, anika, emily, noah, grace, daniel].entries()) {
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
      firstName: "Maria",
      lastName: "Thompson",
      notes: "AM support plan with medication prompt"
    }
  });

  const george = await prisma.careRecipient.create({
    data: {
      facilityId: innerWestFacility.id,
      externalRef: "EV-1002",
      firstName: "George",
      lastName: "Hill",
      notes: "Community transport with appointment escort"
    }
  });

  const elaine = await prisma.careRecipient.create({
    data: {
      facilityId: southSydneyFacility.id,
      externalRef: "BW-1003",
      firstName: "Elaine",
      lastName: "Cooper",
      notes: "Overnight respite with safety checks"
    }
  });

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

  const liamUser = await prisma.user.findUniqueOrThrow({ where: { email: "liam@serenity.local" } });
  const emilyUser = await prisma.user.findUniqueOrThrow({ where: { email: "emily@serenity.local" } });

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
      lastAttemptAt: new Date("2026-04-12T02:15:00.000Z"),
      completedAt: new Date("2026-04-12T02:16:00.000Z"),
      connectorCode: "PAYLOAD_ACCEPTED",
      connectorMessage: "Payload accepted by connector and awaiting external acknowledgement."
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
        summary: "Provider created SR-2401 for Harbour View Care."
      },
      {
        organizationId: provider.id,
        actorUserId: coordinator.id,
        serviceOrderId: orderOne.id,
        visitId: visitOne.id,
        type: AuditEventType.VISIT_ASSIGNED,
        summary: "Morning personal care visit assigned to Liam Ortega."
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
        summary: "Provider created SR-2402 for Evergreen Support Services."
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
    demoPassword: DEMO_PASSWORD,
    orders: 3,
    visits: 5
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

