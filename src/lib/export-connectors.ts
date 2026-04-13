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

export type ConnectorStatusCheckResult =
  | {
      jobStatus: "acknowledged";
      connectorCode: string;
      connectorMessage: string;
      acknowledgedAt: Date;
    }
  | {
      jobStatus: "sent";
      connectorCode: string;
      connectorMessage: string;
    }
  | {
      jobStatus: "failed";
      connectorCode: string;
      connectorMessage: string;
      lastError: string;
    };

type XeroMode = "sandbox" | "auth_only" | "direct_post";

function buildExternalReference(targetSystem: ExportTargetSystem, periodId: string) {
  const suffix = periodId.slice(-6).toUpperCase();

  switch (targetSystem) {
    case "manual_handoff":
      return `MANUAL-${suffix}`;
    case "xero_custom_connection":
      return `XERO-${suffix}`;
    case "mock_payroll_gateway":
      return `MPG-${suffix}`;
    case "qa_failure_simulation":
      return `QA-${suffix}`;
  }
}

function getXeroConfig() {
  return {
    mode: (process.env.XERO_CONNECTION_MODE ?? "sandbox") as XeroMode,
    tokenUrl: process.env.XERO_TOKEN_URL ?? "https://identity.xero.com/connect/token",
    handoffUrl: process.env.XERO_HANDOFF_URL,
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET
  };
}

async function getXeroAccessToken() {
  const config = getXeroConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Missing XERO_CLIENT_ID or XERO_CLIENT_SECRET.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "accounting.transactions accounting.settings"
  });
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xero token request failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as { access_token?: string };

  if (!json.access_token) {
    throw new Error("Xero token response did not include access_token.");
  }

  return json.access_token;
}

async function executeXeroConnector(payload: ClosingExportPackage): Promise<ConnectorExecutionResult> {
  const config = getXeroConfig();

  if (config.mode === "sandbox") {
    return {
      jobStatus: "acknowledged",
      externalReference: `${buildExternalReference("xero_custom_connection", payload.closingPeriod.id)}-SANDBOX`,
      connectorCode: "XERO_SANDBOX_ACK",
      connectorMessage:
        "Xero adapter ran in sandbox mode and acknowledged the payload without external delivery.",
      acknowledgedAt: new Date()
    };
  }

  try {
    const accessToken = await getXeroAccessToken();

    if (config.mode === "auth_only") {
      return {
        jobStatus: "acknowledged",
        externalReference: `${buildExternalReference("xero_custom_connection", payload.closingPeriod.id)}-AUTH`,
        connectorCode: "XERO_AUTH_OK",
        connectorMessage:
          "Xero custom connection authenticated successfully. No downstream handoff endpoint was invoked.",
        acknowledgedAt: new Date()
      };
    }

    if (!config.handoffUrl) {
      throw new Error("XERO_HANDOFF_URL is required when XERO_CONNECTION_MODE=direct_post.");
    }

    const response = await fetch(config.handoffUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-serenity-export-batch": payload.exportBatchId
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const rawBody = await response.text();
    let parsedBody: Record<string, unknown> | null = null;

    try {
      parsedBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      return {
        jobStatus: "failed",
        connectorCode: "XERO_HANDOFF_FAILED",
        connectorMessage: "Xero handoff endpoint rejected the payload.",
        lastError: `HTTP ${response.status}: ${rawBody || "No response body"}`
      };
    }

    const externalReference =
      typeof parsedBody?.externalReference === "string"
        ? parsedBody.externalReference
        : typeof parsedBody?.id === "string"
          ? parsedBody.id
          : response.headers.get("x-external-reference") ??
            `${buildExternalReference("xero_custom_connection", payload.closingPeriod.id)}-POSTED`;

    return {
      jobStatus: "acknowledged",
      externalReference,
      connectorCode: "XERO_HANDOFF_ACK",
      connectorMessage:
        "Xero handoff endpoint accepted the payload and returned an external reference.",
      acknowledgedAt: new Date()
    };
  } catch (error) {
    return {
      jobStatus: "failed",
      connectorCode: "XERO_CONNECTOR_ERROR",
      connectorMessage: "Xero connector could not complete the handoff.",
      lastError: error instanceof Error ? error.message : "Unknown Xero connector error."
    };
  }
}

export async function executeConnector(
  targetSystem: ExportTargetSystem,
  payload: ClosingExportPackage
): Promise<ConnectorExecutionResult> {
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

  if (targetSystem === "xero_custom_connection") {
    return executeXeroConnector(payload);
  }

  return {
    jobStatus: "sent",
    externalReference: buildExternalReference(targetSystem, payload.closingPeriod.id),
    connectorCode: "PAYLOAD_ACCEPTED",
    connectorMessage: "Payload accepted by connector and awaiting external acknowledgement."
  };
}

export async function checkConnectorStatus(
  targetSystem: ExportTargetSystem
): Promise<ConnectorStatusCheckResult> {
  if (targetSystem === "qa_failure_simulation") {
    return {
      jobStatus: "failed",
      connectorCode: "QA_STATUS_CHECK_FAILED",
      connectorMessage: "Connector status check returned a simulated remote rejection.",
      lastError: "Connector status check returned a simulated remote rejection."
    };
  }

  if (targetSystem === "manual_handoff") {
    return {
      jobStatus: "acknowledged",
      connectorCode: "MANUAL_ALREADY_ACKNOWLEDGED",
      connectorMessage: "Manual handoff jobs are considered acknowledged once reviewed.",
      acknowledgedAt: new Date()
    };
  }

  if (targetSystem === "xero_custom_connection") {
    return {
      jobStatus: "acknowledged",
      connectorCode: "XERO_ALREADY_ACKNOWLEDGED",
      connectorMessage:
        "Xero jobs are treated as acknowledged immediately after a successful 2xx handoff with external reference.",
      acknowledgedAt: new Date()
    };
  }

  return {
    jobStatus: "acknowledged",
    connectorCode: "PAYLOAD_ACKNOWLEDGED",
    connectorMessage: "Remote payroll gateway acknowledged the payload after status check.",
    acknowledgedAt: new Date()
  };
}
