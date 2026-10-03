-- CreateEnum
CREATE TYPE "tenant_status" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "legal_name" VARCHAR(160) NOT NULL,
    "trade_name" VARCHAR(160),
    "document" VARCHAR(14) NOT NULL,
    "status" "tenant_status" NOT NULL DEFAULT 'TRIAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- Manual: Prisma não modela CHECK constraints. Defesa em profundidade para o
-- formato do documento (CPF com 11 ou CNPJ com 14 dígitos, apenas números).
ALTER TABLE "tenants"
  ADD CONSTRAINT "tenants_document_format_check"
  CHECK ("document" ~ '^([0-9]{11}|[0-9]{14})$');
