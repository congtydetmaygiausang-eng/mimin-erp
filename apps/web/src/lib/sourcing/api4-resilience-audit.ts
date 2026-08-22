import type { Api0OperationObservation, Api0OperationRole } from "./api0-search-observability";
import { API1_PROVIDER_CONTRACTS } from "./api1-provider-contracts";

export type Api4RecoveryAction = "NONE" | "RETRY_MINIMAL_REQUEST" | "BACKOFF_AND_RETRY" | "RETRY_THEN_FALLBACK" | "USE_FALLBACK" | "FIX_CREDENTIALS" | "CHECK_CONFIGURATION";

export interface Api4ProviderIncident {
  operation: string;
  role: Api0OperationRole;
  status: Api0OperationObservation["status"];
  code: string;
  action: Api4RecoveryAction;
  retryable: boolean;
}

export interface Api4RoleCoverage {
  role: Api0OperationRole;
  configured: number;
  available: number;
  fallbackAvailable: boolean;
  degraded: boolean;
}

export interface Api4ResilienceAudit {
  schemaVersion: "API4.1";
  shadowOnly: true;
  incidents: Api4ProviderIncident[];
  roleCoverage: Api4RoleCoverage[];
  retryableIncidents: number;
  credentialIncidents: number;
  degradedRoles: number;
  healthy: boolean;
}

function recoveryAction(observation: Api0OperationObservation): { action: Api4RecoveryAction; retryable: boolean } {
  const code = (observation.code ?? "").toUpperCase();
  if (observation.status === "DISABLED") return { action: "CHECK_CONFIGURATION", retryable: false };
  if (observation.status === "EMPTY") return { action: "USE_FALLBACK", retryable: false };
  if (observation.status !== "ERROR") return { action: "NONE", retryable: false };
  if (/401|403|UNAUTHORIZED|FORBIDDEN|REQUEST_DENIED/.test(code)) return { action: "FIX_CREDENTIALS", retryable: false };
  if (/422|INVALID_ARGUMENT|UNPROCESSABLE/.test(code)) return { action: "RETRY_MINIMAL_REQUEST", retryable: true };
  if (/429|RATE_LIMIT|RESOURCE_EXHAUSTED/.test(code)) return { action: "BACKOFF_AND_RETRY", retryable: true };
  if (/TIMEOUT|GATEWAY|5\d\d|NETWORK|FETCH/.test(code)) return { action: "RETRY_THEN_FALLBACK", retryable: true };
  return { action: "RETRY_THEN_FALLBACK", retryable: true };
}

export function buildApi4ResilienceAudit(observations: Api0OperationObservation[]): Api4ResilienceAudit {
  const contracts = new Map(API1_PROVIDER_CONTRACTS.map((contract) => [contract.name, contract]));
  const incidents = observations.flatMap((observation): Api4ProviderIncident[] => {
    if (observation.status === "OK" || observation.status === "SKIPPED") return [];
    const recovery = recoveryAction(observation);
    return [{ operation: observation.name, role: observation.role, status: observation.status, code: observation.code ?? observation.status, ...recovery }];
  });

  const roles = Array.from(new Set(observations.map((observation) => observation.role)));
  const roleCoverage = roles.map((role): Api4RoleCoverage => {
    const roleOperations = observations.filter((observation) => observation.role === role);
    const configured = roleOperations.filter((operation) => operation.status !== "DISABLED").length;
    const available = roleOperations.filter((operation) => operation.status === "OK" || operation.status === "SKIPPED").length;
    const fallbackAvailable = roleOperations.some((operation) => {
      const contract = contracts.get(operation.name);
      return contract?.mode === "FALLBACK" && operation.status !== "DISABLED" && operation.status !== "ERROR";
    }) || (roleOperations.filter((operation) => operation.status === "OK").length > 1);
    return { role, configured, available, fallbackAvailable, degraded: configured > 0 && available === 0 };
  });

  const retryableIncidents = incidents.filter((incident) => incident.retryable).length;
  const credentialIncidents = incidents.filter((incident) => incident.action === "FIX_CREDENTIALS").length;
  const degradedRoles = roleCoverage.filter((coverage) => coverage.degraded).length;
  return {
    schemaVersion: "API4.1",
    shadowOnly: true,
    incidents,
    roleCoverage,
    retryableIncidents,
    credentialIncidents,
    degradedRoles,
    healthy: credentialIncidents === 0 && degradedRoles === 0,
  };
}

export function api4ToolCall(audit: Api4ResilienceAudit): { type: "API4_RESILIENCE_AUDIT"; audit: Api4ResilienceAudit } {
  return { type: "API4_RESILIENCE_AUDIT", audit };
}
