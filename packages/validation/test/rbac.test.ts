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

  it("contém o catálogo aprovado e não contém as permissões removidas ou fora do MVP", () => {
    const required = [
      "customers.view_history", "customers.manage_contacts", "vehicles.delete",
      "services.read", "services.create", "services.update", "services.deactivate",
      "services.manage_prices", "services.manage_fiscal",
      "products.read", "products.create", "products.update", "products.deactivate",
      "products.view_cost", "products.manage_prices", "products.manage_fiscal",
      "quotes.send", "quotes.approve", "quotes.reject", "quotes.cancel", "quotes.convert",
      "quotes.edit_prices", "quotes.apply_discount", "quotes.view_cost", "quotes.print",
      "work_orders.change_status", "work_orders.register_approval", "work_orders.complete",
      "work_orders.reopen", "work_orders.close", "work_orders.cancel", "work_orders.assign",
      "work_orders.edit_prices", "work_orders.apply_discount", "work_orders.view_cost", "work_orders.print",
      "financial.read", "financial.create", "financial.update", "fiscal.read", "fiscal.issue",
    ];
    for (const key of required) expect(isPermission(key), key).toBe(true);

    for (const key of [
      "quotes.delete", "work_orders.delete", "customers.export", "work_orders.close_with_receivable",
      "financial.delete", "fiscal.create", "fiscal.update", "fiscal.delete",
    ]) {
      expect(isPermission(key), key).toBe(false);
    }
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
  });

  it("OWNER e ADMIN recebem todas as permissões", () => {
    expect([...DEFAULT_ROLE_PERMISSIONS.OWNER].sort()).toEqual([...PERMISSION_KEYS].sort());
    expect([...DEFAULT_ROLE_PERMISSIONS.ADMIN].sort()).toEqual([...PERMISSION_KEYS].sort());
  });

  it("VIEWER recebe exatamente a leitura dos módulos aprovados", () => {
    expect([...DEFAULT_ROLE_PERMISSIONS.VIEWER].sort()).toEqual(
      [
        "customers.read", "vehicles.read", "services.read", "products.read",
        "quotes.read", "work_orders.read", "financial.read", "fiscal.read",
      ].sort(),
    );
  });

  it("ATTENDANT não vê custos, não aplica desconto, não altera preço e não cancela/conclui OS", () => {
    const attendant = DEFAULT_ROLE_PERMISSIONS.ATTENDANT;
    for (const key of [
      "customers.delete", "vehicles.delete", "quotes.cancel", "quotes.edit_prices", "quotes.apply_discount",
      "quotes.view_cost", "products.view_cost", "work_orders.complete", "work_orders.reopen",
      "work_orders.cancel", "work_orders.edit_prices", "work_orders.apply_discount", "work_orders.view_cost",
      "financial.read", "fiscal.read", "users.read", "audit.read",
    ] as const) {
      expect(attendant, key).not.toContain(key);
    }
    expect(attendant).toContain("quotes.convert");
    expect(attendant).toContain("work_orders.register_approval");
  });

  it("MECHANIC conclui OS, mas não abre, cancela, reabre, atribui nem mexe em preço ou custo", () => {
    const mechanic = DEFAULT_ROLE_PERMISSIONS.MECHANIC;
    expect(mechanic).toContain("work_orders.complete");
    expect(mechanic).toContain("work_orders.change_status");
    for (const key of [
      "work_orders.create", "work_orders.cancel", "work_orders.reopen", "work_orders.assign",
      "work_orders.edit_prices", "work_orders.apply_discount", "work_orders.view_cost",
      "products.manage_prices", "services.manage_prices", "financial.read", "fiscal.read",
    ] as const) {
      expect(mechanic, key).not.toContain(key);
    }
  });

  it("FINANCIAL tem financeiro, fiscal e fechamento de OS, sem veículos nem alterações operacionais", () => {
    const financial = DEFAULT_ROLE_PERMISSIONS.FINANCIAL;
    for (const key of [
      "financial.read", "financial.create", "financial.update", "fiscal.read", "fiscal.issue",
      "work_orders.close", "work_orders.print", "products.view_cost",
    ] as const) {
      expect(financial, key).toContain(key);
    }
    expect(financial.some((key) => key.startsWith("vehicles."))).toBe(false);
    expect(financial).not.toContain("work_orders.update");
    expect(financial).not.toContain("quotes.create");
  });

  it("MANAGER tem o acesso operacional aprovado, sem gerenciar usuários e sem finalizar OS", () => {
    const manager = DEFAULT_ROLE_PERMISSIONS.MANAGER;
    const operational = PERMISSION_KEYS.filter((key) =>
      /^(customers|vehicles|services|products|quotes)\./.test(key),
    );
    for (const key of operational) expect(manager, key).toContain(key);
    for (const key of [
      "work_orders.complete", "work_orders.reopen", "work_orders.cancel", "work_orders.view_cost",
      "financial.update", "fiscal.issue", "users.read", "audit.read",
    ] as const) {
      expect(manager, key).toContain(key);
    }
    expect(manager).not.toContain("work_orders.close");
    expect(manager).not.toContain("users.manage");
    expect(manager).not.toContain("settings.manage");
  });

  it("valida chaves desconhecidas", () => {
    expect(isPermission("customers.read")).toBe(true);
    expect(isPermission("customers.hack")).toBe(false);
    expect(isPermission("__proto__")).toBe(false);
    expect(isRole("OWNER")).toBe(true);
    expect(isRole("ROOT")).toBe(false);
  });
});
