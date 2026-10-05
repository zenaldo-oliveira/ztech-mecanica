// Validação de CPF e CNPJ (dígitos verificadores) — fonte única para frontend e backend.
// Aceita entrada com ou sem pontuação; compara sempre somente os dígitos.
// Decisão registrada em docs/modules/clientes.md §5.

/** Remove tudo que não for dígito (pontuação, espaços, máscara). */
export function documentDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Sequências como 000.000.000-00 ou 11.111.111/1111-11 passam no cálculo, mas são inválidas. */
function isRepeatedSequence(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/** Dígito verificador no padrão módulo 11 com os pesos informados. */
function checkDigit(digits: string, weights: readonly number[], toDigit: (remainder: number) => number): number {
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  return toDigit(sum % 11);
}

const CPF_FIRST_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CPF_SECOND_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** CPF: 11 dígitos, dígitos verificadores corretos e sem sequência repetida. */
export function isValidCpf(value: string): boolean {
  const digits = documentDigits(value);
  if (!/^\d{11}$/.test(digits) || isRepeatedSequence(digits)) return false;
  const cpfDigit = (remainder: number) => (remainder < 2 ? 0 : 11 - remainder);
  return (
    checkDigit(digits, CPF_FIRST_WEIGHTS, cpfDigit) === Number(digits[9]) &&
    checkDigit(digits, CPF_SECOND_WEIGHTS, cpfDigit) === Number(digits[10])
  );
}

/** CNPJ (numérico): 14 dígitos, dígitos verificadores corretos e sem sequência repetida. */
export function isValidCnpj(value: string): boolean {
  const digits = documentDigits(value);
  if (!/^\d{14}$/.test(digits) || isRepeatedSequence(digits)) return false;
  const cnpjDigit = (remainder: number) => (remainder < 2 ? 0 : 11 - remainder);
  return (
    checkDigit(digits, CNPJ_FIRST_WEIGHTS, cnpjDigit) === Number(digits[12]) &&
    checkDigit(digits, CNPJ_SECOND_WEIGHTS, cnpjDigit) === Number(digits[13])
  );
}

export type DocumentPersonType = "INDIVIDUAL" | "BUSINESS";

/**
 * Problema do documento para o tipo de pessoa, ou null se válido. A mensagem nunca repete o
 * número informado (dado pessoal).
 */
export function documentIssue(personType: DocumentPersonType, value: string): string | null {
  const digits = documentDigits(value);
  if (personType === "INDIVIDUAL") {
    if (digits.length !== 11) return "CPF deve ter 11 dígitos.";
    return isValidCpf(digits) ? null : "CPF inválido: confira os dígitos.";
  }
  if (digits.length !== 14) return "CNPJ deve ter 14 dígitos.";
  return isValidCnpj(digits) ? null : "CNPJ inválido: confira os dígitos.";
}
