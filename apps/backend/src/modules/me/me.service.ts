import type { Permission, Role } from "@ztech/validation";

import type { TenantDb } from "../../db/tenant-scope.js";

/** Dados públicos da sessão atual. Mesmo formato em GET /me e POST /auth/login. */
export interface MeView {
  user: { id: string; name: string; email: string; status: string; lastLoginAt: Date | null };
  tenant: { id: string; legalName: string; tradeName: string | null; status: string };
  roles: Role[];
  permissions: Permission[];
}

export async function loadMeView(
  db: TenantDb,
  userId: string,
  roles: readonly Role[],
  permissions: ReadonlySet<Permission>,
): Promise<MeView | null> {
  const [user, tenant] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, status: true, lastLoginAt: true },
    }),
    // O escopo da oficina restringe Tenant à oficina da sessão.
    db.tenant.findFirst({ select: { id: true, legalName: true, tradeName: true, status: true } }),
  ]);
  if (!user || !tenant) return null;

  return { user, tenant, roles: [...roles], permissions: [...permissions].sort() };
}
