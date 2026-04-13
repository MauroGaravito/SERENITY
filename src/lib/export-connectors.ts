import type { ClosingExportPackage, ExportTargetSystem } from "@/lib/providers";

export type ConnectorExecutionResult =
  | {
      jobStatus: "acknowledged" | "sent";
      externalReference: string;
      connectorCode: string;
      connectorMessage: string;
      acknowledgedAt?: Date;
    }
  | {
      jobStatus: "failed";
      connectorCode: string;
      connectorMessage: string;
      lastError: string;
    };

function buildExternalReference(targetSystem: ExportTargetSystem, periodId: string) {
  const suffix = periodId.slice(-6).toUpperCase();

  switch (targetSystem) {
    case "manual_handoff":
      return `MANUAL-${suffix}`;
    case "mock_payroll_gateway":
      return `MPG-${suffix}`;
    case "qa_failure_simulation":
      return `QA-${suffix}`;
  }
}

export function executeConnector(
  targetSystem: ExportTargetSystem,
  payload: ClosingExportPackage
): ConnectorExecutionResult {
  if (targetSystem === "qa_failure_simulation") {
    return {
      jobStatus: "failed",
      connectorCode: "QA_CONNECTOR_REJECTED",
      connectorMessage: "Mock connector rejected the payload during delivery.",
      lastError: "Mock connector rejected the payload during delivery."
    };
  }

  if (targetSystem === "manual_handoff") {
    return {
      jobStatus: "acknowledged",
      externalReference: buildExternalReference(targetSystem, payload.closingPeriod.id),
      connectorCode: "MANUAL_REGISTERED",
      connectorMessage: "Manual handoff register completed and acknowledged immediately.",
      acknowledgedAt: new Date()
    };
  }

  return {
    jobStatus: "sent",
    externalReference: buildExternalReference(targetSystem, payload.closingPeriod.id),
    connectorCode: "PAYLOAD_ACCEPTED",
    connectorMessage: "Payload accepted by connector and awaiting external acknowledgement."
  };
}
