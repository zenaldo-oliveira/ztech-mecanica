import { z } from "zod";

// Schemas estritos: qualquer campo não documentado (ex.: tenantId) é rejeitado com 400.
// A oficina vem exclusivamente da sessão — nunca de URL, query, header ou corpo.

export const userIdParamsSchema = z.strictObject({
  id: z.uuid({ message: "Identificador inválido." }),
});

export const listUsersQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserBodySchema = z
  .strictObject({
    name: z.string().trim().min(2).max(120).optional(),
    status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  })
  .refine((body) => body.name !== undefined || body.status !== undefined, {
    message: "Informe ao menos um campo para alterar.",
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
