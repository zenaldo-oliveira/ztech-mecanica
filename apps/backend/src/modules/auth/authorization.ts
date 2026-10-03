import { isPermission, isRole, type Permission, type Role } from "@ztech/validation";

import type { PrismaClient } from "../../db/client.js";

export interface UserAuthorization {
  roles: Role[];
  permissions: ReadonlySet<Permission>;
}

/** Papéis e permissões efetivas do usuário na oficina (união das permissões de todos os papéis). */
export async function loadUserAuthorization(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
): Promise<UserAuthorization> {
  const userRoles = await prisma.userRole.findMany({
    where: { tenantId, userId },
    select: { role: { select: { key: true, permissions: { select: { permission: { select: { key: true } } } } } } },
  });

  const roles = userRoles.map((userRole) => userRole.role.key).filter(isRole);
  const permissions = new Set<Permission>();
  for (const userRole of userRoles) {
    for (const link of userRole.role.permissions) {
      if (isPermission(link.permission.key)) permissions.add(link.permission.key);
    }
  }
  return { roles, permissions };
}
