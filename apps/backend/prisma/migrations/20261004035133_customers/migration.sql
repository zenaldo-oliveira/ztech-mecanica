-- CreateEnum
CREATE TYPE "person_type" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "contact_preference" AS ENUM ('WHATSAPP', 'EMAIL', 'PHONE', 'NONE');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "person_type" "person_type" NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "trade_name" VARCHAR(160),
    "document" VARCHAR(14) NOT NULL,
    "status" "customer_status" NOT NULL DEFAULT 'ACTIVE',
    "phone" VARCHAR(11) NOT NULL,
    "whatsapp" VARCHAR(11),
    "email" VARCHAR(254),
    "secondary_phone" VARCHAR(11),
    "secondary_email" VARCHAR(254),
    "zip_code" CHAR(8),
    "street" VARCHAR(160),
    "address_number" VARCHAR(20),
    "complement" VARCHAR(80),
    "neighborhood" VARCHAR(80),
    "city" VARCHAR(80),
    "state" CHAR(2),
    "contact_preference" "contact_preference" NOT NULL,
    "notes" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_tenant_id_status_idx" ON "customers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_id_key" ON "customers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_number_key" ON "customers"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_document_key" ON "customers"("tenant_id", "document");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Manual: Prisma não modela CHECK constraints. Defesa em profundidade para as regras de
-- docs/modules/clientes.md: documento compatível com o tipo de pessoa (§5), nome fantasia só
-- para pessoa jurídica (§4) e campos normalizados (somente dígitos / e-mail minúsculo / UF).
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_document_person_type_check"
  CHECK (("person_type" = 'INDIVIDUAL' AND "document" ~ '^[0-9]{11}$')
      OR ("person_type" = 'BUSINESS' AND "document" ~ '^[0-9]{14}$'));
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_trade_name_business_check"
  CHECK ("trade_name" IS NULL OR "person_type" = 'BUSINESS');
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_phones_digits_check"
  CHECK ("phone" ~ '^[0-9]{10,11}$'
     AND ("whatsapp" IS NULL OR "whatsapp" ~ '^[0-9]{10,11}$')
     AND ("secondary_phone" IS NULL OR "secondary_phone" ~ '^[0-9]{10,11}$'));
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_emails_lowercase_check"
  CHECK (("email" IS NULL OR "email" = lower("email"))
     AND ("secondary_email" IS NULL OR "secondary_email" = lower("secondary_email")));
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_address_format_check"
  CHECK (("zip_code" IS NULL OR "zip_code" ~ '^[0-9]{8}$')
     AND ("state" IS NULL OR "state" ~ '^[A-Z]{2}$'));
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_number_check"
  CHECK ("number" >= 1);

-- Manual: tenant_id imutável (mesma regra das demais tabelas da oficina).
CREATE TRIGGER "customers_forbid_tenant_change" BEFORE UPDATE OF "tenant_id" ON "customers"
  FOR EACH ROW EXECUTE FUNCTION "forbid_tenant_change"();
