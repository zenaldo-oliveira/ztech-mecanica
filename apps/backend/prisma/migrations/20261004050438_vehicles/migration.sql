-- CreateEnum
CREATE TYPE "vehicle_type" AS ENUM ('CAR', 'MOTORCYCLE');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "vehicle_type" NOT NULL,
    "brand" VARCHAR(80) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "version" VARCHAR(80),
    "manufacture_year" INTEGER,
    "model_year" INTEGER,
    "plate" VARCHAR(7) NOT NULL,
    "chassis_number" CHAR(17),
    "renavam" CHAR(11),
    "last_mileage" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_customer_id_idx" ON "vehicles"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_id_key" ON "vehicles"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenant_id_plate_key" ON "vehicles"("tenant_id", "plate");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_customer_id_fkey" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "customers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Manual: Prisma não modela CHECK constraints. Defesa em profundidade para as regras
-- aprovadas em docs/modules/veiculos.md (decisões V2–V4). O limite superior dos anos
-- ("ano atual + 1") fica na aplicação: um CHECK que dependa da data atual não é imutável.
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_plate_format_check"
  CHECK ("plate" ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$');
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_years_check"
  CHECK (("manufacture_year" IS NULL OR "manufacture_year" >= 1900)
     AND ("model_year" IS NULL OR "model_year" >= 1900)
     AND ("manufacture_year" IS NULL OR "model_year" IS NULL
          OR "model_year" BETWEEN "manufacture_year" AND "manufacture_year" + 1));
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_chassis_number_format_check"
  CHECK ("chassis_number" IS NULL OR "chassis_number" ~ '^[A-HJ-NPR-Z0-9]{17}$');
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_renavam_format_check"
  CHECK ("renavam" IS NULL OR "renavam" ~ '^[0-9]{11}$');
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_last_mileage_check"
  CHECK ("last_mileage" IS NULL OR "last_mileage" >= 0);

-- Manual: tenant_id imutável (mesma regra das demais tabelas da oficina).
CREATE TRIGGER "vehicles_forbid_tenant_change" BEFORE UPDATE OF "tenant_id" ON "vehicles"
  FOR EACH ROW EXECUTE FUNCTION "forbid_tenant_change"();
