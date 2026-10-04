-- CreateTable
CREATE TABLE "tenant_settings" (
    "tenant_id" UUID NOT NULL,
    "default_hourly_rate" DECIMAL(12,2),
    "quote_validity_days" INTEGER NOT NULL DEFAULT 7,
    "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_sequences" (
    "tenant_id" UUID NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "next_value" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenant_sequences_pkey" PRIMARY KEY ("tenant_id","key")
);

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tenant_sequences" ADD CONSTRAINT "tenant_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Manual: Prisma não modela CHECK constraints. Limites da documentação:
-- valor-hora ≥ 0 e até 9.999.999,99 (docs/modules/servicos.md §10); validade do
-- orçamento entre 0 e 365 dias (docs/modules/orcamentos.md §10).
ALTER TABLE "tenant_settings"
  ADD CONSTRAINT "tenant_settings_default_hourly_rate_check"
  CHECK ("default_hourly_rate" IS NULL OR ("default_hourly_rate" >= 0 AND "default_hourly_rate" <= 9999999.99));
ALTER TABLE "tenant_settings"
  ADD CONSTRAINT "tenant_settings_quote_validity_days_check"
  CHECK ("quote_validity_days" BETWEEN 0 AND 365);
ALTER TABLE "tenant_settings"
  ADD CONSTRAINT "tenant_settings_timezone_check"
  CHECK ("timezone" <> '');

-- Manual: chave em MAIÚSCULAS_COM_SUBLINHADO (ex.: WORK_ORDER) e próximo número ≥ 1.
ALTER TABLE "tenant_sequences"
  ADD CONSTRAINT "tenant_sequences_key_format_check"
  CHECK ("key" ~ '^[A-Z][A-Z0-9_]*$');
ALTER TABLE "tenant_sequences"
  ADD CONSTRAINT "tenant_sequences_next_value_check"
  CHECK ("next_value" >= 1);

-- Manual: tenant_id imutável (mesma regra das demais tabelas da oficina).
CREATE TRIGGER "tenant_settings_forbid_tenant_change" BEFORE UPDATE OF "tenant_id" ON "tenant_settings"
  FOR EACH ROW EXECUTE FUNCTION "forbid_tenant_change"();
CREATE TRIGGER "tenant_sequences_forbid_tenant_change" BEFORE UPDATE OF "tenant_id" ON "tenant_sequences"
  FOR EACH ROW EXECUTE FUNCTION "forbid_tenant_change"();
