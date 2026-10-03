import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, PERMISSION_KEYS, ROLES, ROLE_KEYS } from "@ztech/validation";

import type { PrismaClient } from "../../db/client.js";

/**
 * Sincroniza papéis, permissões e a matriz padrão do código (@ztech/validation)
 * para o banco. Idempotente: pode rodar a cada deploy/seed. Remove do banco
 * permissões de papel que saíram da matriz, mantendo o catálogo como fonte de verdade.
 */
export async function syncRbacCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const key of PERMISSION_KEYS) {
      await tx.permission.upsert({
        where: { key },
        update: { description: PERMISSIONS[key] },
        create: { key, description: PERMISSIONS[key] },
      });
    }
    for (const key of ROLE_KEYS) {
      await tx.role.upsert({ where: { key }, update: { name: ROLES[key] }, create: { key, name: ROLES[key] } });
    }

    const permissions = await tx.permission.findMany({ select: { id: true, key: true } });
    const roles = await tx.role.findMany({ select: { id: true, key: true } });
    const permissionIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

    for (const role of roles) {
      if (!(role.key in DEFAULT_ROLE_PERMISSIONS)) continue;
      const wanted = DEFAULT_ROLE_PERMISSIONS[role.key as keyof typeof DEFAULT_ROLE_PERMISSIONS]
        .map((key) => permissionIdByKey.get(key))
        .filter((id): id is string => Boolean(id));

      await tx.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { notIn: wanted } } });
      await tx.rolePermission.createMany({
        data: wanted.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  });
}
