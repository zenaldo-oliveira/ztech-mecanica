import type { TenantDb } from "../../db/tenant-scope.js";
import type { InputJsonValue } from "../../generated/prisma/internal/prismaNamespace.js";

// Nunca registrar senhas, tokens, chaves, segredos, hashes ou material de certificado
// (docs/architecture/seguranca.md §8). Chaves que casam com o padrão são mascaradas.
const SENSITIVE_KEY = /pass(word)?|secret|token|api[-_]?key|authorization|cookie|private[-_]?key|hash|certificate|pfx|pem/i;
const REDACTED = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_STRING_LENGTH = 1000;

export function sanitizeMetadata(value: unknown, depth = 0): InputJsonValue | null {
  if (value === null || value === undefined) return null;
  if (depth > MAX_DEPTH) return "[TRUNCATED]";
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeMetadata(item, depth + 1));
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : sanitizeMetadata(item, depth + 1),
    ]);
    return Object.fromEntries(entries) as InputJsonValue;
  }
  return String(value);
}

export interface AuditActor {
  userId: string;
}

export interface AuditRequestInfo {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntry {
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Registra uma ação de usuário da oficina. O tenantId é aplicado pelo escopo da oficina. */
export async function recordUserAudit(
  db: TenantDb,
  actor: AuditActor,
  request: AuditRequestInfo,
  entry: AuditEntry,
): Promise<void> {
  const metadata = entry.metadata ? sanitizeMetadata(entry.metadata) : null;
  await db.auditLog.create({
    data: {
      actorType: "USER",
      userId: actor.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      ...(metadata === null ? {} : { metadata }),
      requestId: request.requestId,
      ipAddress: request.ipAddress?.slice(0, 45),
      userAgent: request.userAgent?.slice(0, 512),
    },
  });
}
