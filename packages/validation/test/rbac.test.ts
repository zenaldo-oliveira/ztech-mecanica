import { describe, expect, it } from "vitest";

import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_KEYS, ROLE_KEYS, isPermission, isRole } from "../src/rbac.js";

describe("catálogo RBAC", () => {
  it("usa o formato recurso.ação em todas as permissões", () => {
    for (const key of PERMISSION_KEYS) expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
  });

  it("define os 7 papéis aprovados", () => {
    expect(ROLE_KEYS).toEqual(["OWNER", "ADMIN", "MANAGER", "ATTENDANT", "MECHANIC", "FINANCIAL", "VIEWER"]);
  });

  it("só atribui permissões existentes e sem repetição", () => {
    for (const role of ROLE_KEYS) {
      const permissions = DEFAULT_ROLE_PERMISSIONS[role];
      expect(permissions.every(isPermission)).toBe(true);
      expect(new Set(permissions).size).toBe(permissions.length);
    }
  });

  it("VIEWER só lê e não gerencia usuários nem auditoria", () => {
    const viewer = DEFAULT_ROLE_PERMISSIONS.VIEWER;
    expect(viewer.length).toBeGreaterThan(0);
    expect(viewer.every((key) => key.endsWith(".read"))).toBe(true);
    expect(viewer).not.toContain("users.read");
    expect(viewer).not.toContain("audit.read");
  });

  it("apenas OWNER e ADMIN gerenciam usuários", () => {
    const managers = ROLE_KEYS.filter((role) => DEFAULT_ROLE_PERMISSIONS[role].includes("users.manage"));
    expect(managers).toEqual(["OWNER", "ADMIN"]);
  });

  it("valida chaves desconhecidas", () => {
    expect(isPermission("customers.read")).toBe(true);
    expect(isPermission("customers.hack")).toBe(false);
    expect(isPermission("__proto__")).toBe(false);
    expect(isRole("OWNER")).toBe(true);
    expect(isRole("ROOT")).toBe(false);
  });
});
