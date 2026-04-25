import type { VisitStatus as PrismaVisitStatus } from "@prisma/client";
import type { VisitStatus } from "@/lib/providers";

export type VisitActor = "provider" | "carer" | "reviewer" | "system";

export type VisitTransitionContext = {
  assignedCarerId?: string | null;
  hasActualStart?: boolean;
  hasActualEnd?: boolean;
};

type VisitTransitionRule = {
  actors: VisitActor[];
  requiresAssignedCarer?: boolean;
  requiresActualStart?: boolean;
  requiresActualEnd?: boolean;
};

const providerVisitTransitions = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: ["under_review"],
  under_review: [],
  approved: [],
  rejected: ["completed"],
  cancelled: [],
  no_show: []
} satisfies Record<VisitStatus, VisitStatus[]>;

const carerVisitTransitions = {
  scheduled: [],
  confirmed: ["in_progress"],
  in_progress: ["completed"],
  completed: ["under_review"],
  under_review: [],
  approved: [],
  rejected: [],
  cancelled: [],
  no_show: []
} satisfies Record<VisitStatus, VisitStatus[]>;

const reviewVisitTransitions = {
  scheduled: [],
  confirmed: [],
  in_progress: [],
  completed: [],
  under_review: ["approved", "rejected"],
  approved: [],
  rejected: [],
  cancelled: [],
  no_show: []
} satisfies Record<VisitStatus, VisitStatus[]>;

const transitionRules: Partial<Record<VisitStatus, VisitTransitionRule>> = {
  confirmed: {
    actors: ["provider"],
    requiresAssignedCarer: true
  },
  in_progress: {
    actors: ["provider", "carer"],
    requiresAssignedCarer: true
  },
  completed: {
    actors: ["provider", "carer"],
    requiresAssignedCarer: true,
    requiresActualStart: true
  },
  under_review: {
    actors: ["provider", "carer"],
    requiresAssignedCarer: true,
    requiresActualStart: true,
    requiresActualEnd: true
  },
  approved: {
    actors: ["reviewer"],
    requiresAssignedCarer: true,
    requiresActualStart: true,
    requiresActualEnd: true
  },
  rejected: {
    actors: ["reviewer"],
    requiresAssignedCarer: true
  },
  no_show: {
    actors: ["provider"],
    requiresAssignedCarer: true
  },
  cancelled: {
    actors: ["provider"]
  }
};

function normalizeVisitStatus(status: PrismaVisitStatus | VisitStatus): VisitStatus {
  return status.toLowerCase() as VisitStatus;
}

function transitionMapForActor(actor: VisitActor) {
  if (actor === "carer") {
    return carerVisitTransitions;
  }

  if (actor === "reviewer") {
    return reviewVisitTransitions;
  }

  return providerVisitTransitions;
}

export function getAllowedVisitTransitions(
  currentStatus: PrismaVisitStatus | VisitStatus,
  actor: VisitActor,
  context: VisitTransitionContext = {}
) {
  const current = normalizeVisitStatus(currentStatus);
  const candidates = transitionMapForActor(actor)[current];

  return candidates.filter((nextStatus) => {
    const rule = transitionRules[nextStatus];

    if (!rule) {
      return true;
    }

    if (!rule.actors.includes(actor)) {
      return false;
    }

    if (rule.requiresAssignedCarer && !context.assignedCarerId) {
      return false;
    }

    if (rule.requiresActualStart && !context.hasActualStart) {
      return false;
    }

    if (rule.requiresActualEnd && !context.hasActualEnd) {
      return false;
    }

    return true;
  });
}

export function assertVisitTransition({
  actor,
  assignedCarerId,
  currentStatus,
  hasActualEnd,
  hasActualStart,
  nextStatus
}: VisitTransitionContext & {
  actor: VisitActor;
  currentStatus: PrismaVisitStatus | VisitStatus;
  nextStatus: PrismaVisitStatus | VisitStatus;
}) {
  const current = normalizeVisitStatus(currentStatus);
  const next = normalizeVisitStatus(nextStatus);
  const allowed = getAllowedVisitTransitions(current, actor, {
    assignedCarerId,
    hasActualEnd,
    hasActualStart
  });

  if (!allowed.some((status) => status === next)) {
    throw new Error(`Invalid visit transition: ${current} -> ${next}.`);
  }
}
