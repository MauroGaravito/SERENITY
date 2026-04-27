export type AvailabilityBlockLike = {
  startsAt: Date;
  endsAt: Date;
  isWorking: boolean;
};

export type ScheduledVisitLike = {
  id?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status?: string;
  label?: string;
};

export type AvailabilityAssessment = {
  status: "available" | "partial" | "unavailable" | "conflict" | "unknown";
  matches: boolean;
  summary: string;
  reasons: string[];
};

const NON_CONFLICTING_VISIT_STATUSES = new Set([
  "APPROVED",
  "CANCELLED",
  "NO_SHOW",
  "REJECTED",
  "approved",
  "cancelled",
  "no_show",
  "rejected"
]);

function overlaps(
  left: { startsAt: Date; endsAt: Date },
  right: { startsAt: Date; endsAt: Date }
) {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt;
}

function covers(
  block: { startsAt: Date; endsAt: Date },
  window: { startsAt: Date; endsAt: Date }
) {
  return block.startsAt <= window.startsAt && block.endsAt >= window.endsAt;
}

function formatWindow(start: Date, end: Date) {
  return `${start.toLocaleString("en-AU")} - ${end.toLocaleString("en-AU")}`;
}

export function assessAvailabilityForVisit({
  blocks,
  existingVisits,
  targetVisit
}: {
  blocks: AvailabilityBlockLike[];
  existingVisits: ScheduledVisitLike[];
  targetVisit: {
    id?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  };
}): AvailabilityAssessment {
  const targetWindow = {
    startsAt: targetVisit.scheduledStart,
    endsAt: targetVisit.scheduledEnd
  };
  const unavailableConflict = blocks.find(
    (block) => !block.isWorking && overlaps(block, targetWindow)
  );
  const workingBlocks = blocks.filter((block) => block.isWorking);
  const coveringWorkingBlock = workingBlocks.find((block) => covers(block, targetWindow));
  const partialWorkingBlock = workingBlocks.find((block) => overlaps(block, targetWindow));
  const overlappingVisit = existingVisits.find((visit) => {
    if (visit.id && visit.id === targetVisit.id) {
      return false;
    }

    if (visit.status && NON_CONFLICTING_VISIT_STATUSES.has(visit.status)) {
      return false;
    }

    return overlaps(
      { startsAt: visit.scheduledStart, endsAt: visit.scheduledEnd },
      targetWindow
    );
  });

  if (overlappingVisit) {
    return {
      status: "conflict",
      matches: false,
      summary: "Overlapping assignment",
      reasons: [
        `Already assigned during ${formatWindow(
          overlappingVisit.scheduledStart,
          overlappingVisit.scheduledEnd
        )}.`
      ]
    };
  }

  if (unavailableConflict) {
    return {
      status: "unavailable",
      matches: false,
      summary: "Unavailable during visit window",
      reasons: [
        `Unavailable block overlaps ${formatWindow(
          unavailableConflict.startsAt,
          unavailableConflict.endsAt
        )}.`
      ]
    };
  }

  if (coveringWorkingBlock) {
    return {
      status: "available",
      matches: true,
      summary: "Working block covers the visit",
      reasons: []
    };
  }

  if (partialWorkingBlock) {
    return {
      status: "partial",
      matches: false,
      summary: "Only partially available",
      reasons: [
        `Working block only partially overlaps ${formatWindow(
          partialWorkingBlock.startsAt,
          partialWorkingBlock.endsAt
        )}.`
      ]
    };
  }

  return {
    status: "unknown",
    matches: false,
    summary: "No working block covers the visit",
    reasons: ["No declared working block covers the full visit window."]
  };
}
