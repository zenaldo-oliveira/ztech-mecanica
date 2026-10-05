-- Manual: Prisma não modela CHECK constraints. Decisão aprovada (docs/modules/veiculos.md §12,
-- V3 revisada): o ano do modelo só pode ser informado junto com o ano de fabricação.
-- Migration aditiva: a regra entre os dois anos já está em "vehicles_years_check".
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_model_year_requires_manufacture_year_check"
  CHECK ("model_year" IS NULL OR "manufacture_year" IS NOT NULL);
