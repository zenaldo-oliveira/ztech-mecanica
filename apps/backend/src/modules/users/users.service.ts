import type { TenantDb } from "../../db/tenant-scope.js";
import { conflict, notFound } from "../../lib/errors.js";
import { recordUserAudit, type AuditRequestInfo } from "../audit/audit-service.js";
import type { SessionService } from "../auth/session-service.js";
import type { ListUsersQuery, UpdateUserBody } from "./users.schemas.js";

// Campos expostos pela API. passwordHash nunca é selecionado.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { key: true } } } },
} as const;

type UserRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: { key: string } }[];
};

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    roles: row.roles.map((link) => link.role.key),
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface UsersServiceContext {
  /** Client restrito à oficina da sessão. */
  db: TenantDb;
  actorUserId: string;
  tenantId: string;
  request: AuditRequestInfo;
  sessionService: SessionService;
}

/** Garante que a oficina continue com ao menos um OWNER ativo além do usuário alvo. */
async function assertNotLastActiveOwner(db: TenantDb, targetUserId: string): Promise<void> {
  const targetIsOwner = await db.userRole.count({ where: { userId: targetUserId, role: { key: "OWNER" } } });
  if (targetIsOwner === 0) return;

  const otherActiveOwners = await db.user.count({
    where: { id: { not: targetUserId }, status: "ACTIVE", roles: { some: { role: { key: "OWNER" } } } },
  });
  if (otherActiveOwners === 0) {
    throw conflict("A oficina precisa de ao menos um proprietário ativo.");
  }
}

export function createUsersService(context: UsersServiceContext) {
  const { db, actorUserId, tenantId, request, sessionService } = context;

  async function list(query: ListUsersQuery) {
    const [rows, total] = await Promise.all([
      db.user.findMany({
        select: publicUserSelect,
        orderBy: { createdAt: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.user.count(),
    ]);
    return { data: rows.map(toPublicUser), meta: { page: query.page, pageSize: query.pageSize, total } };
  }

  /** Usuário de outra oficina é indistinguível de inexistente: sempre 404. */
  async function get(id: string): Promise<PublicUser> {
    const row = await db.user.findUnique({ where: { id }, select: publicUserSelect });
    if (!row) throw notFound("Usuário não encontrado.");
    return toPublicUser(row);
  }

  async function update(id: string, body: UpdateUserBody): Promise<PublicUser> {
    const before = await get(id);

    if (body.status === "BLOCKED" && before.status !== "BLOCKED") {
      if (id === actorUserId) throw conflict("Você não pode bloquear o próprio usuário.");
      await assertNotLastActiveOwner(db, id);
    }

    const row = await db.user.update({ where: { id }, data: body, select: publicUserSelect });
    const after = toPublicUser(row);

    if (after.status === "BLOCKED" && before.status !== "BLOCKED") {
      await sessionService.revokeAllForUser(tenantId, id, "USER_BLOCKED");
    }
    await recordUserAudit(db, { userId: actorUserId }, request, {
      action: "USER_UPDATED",
      entity: "User",
      entityId: id,
      metadata: {
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      },
    });
    return after;
  }

  async function remove(id: string): Promise<void> {
    if (id === actorUserId) throw conflict("Você não pode excluir o próprio usuário.");
    const target = await get(id);
    await assertNotLastActiveOwner(db, id);

    await sessionService.revokeAllForUser(tenantId, id, "USER_DELETED");
    // Sessões e papéis são removidos em cascata (FK composta tenant_id, user_id).
    await db.user.delete({ where: { id } });
    await recordUserAudit(db, { userId: actorUserId }, request, {
      action: "USER_DELETED",
      entity: "User",
      entityId: id,
      metadata: { email: target.email, roles: target.roles },
    });
  }

  return { list, get, update, remove };
}
