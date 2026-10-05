import type { PersonType } from "@/lib/api/customers";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatDocument(document: string, personType: PersonType): string {
  const digits = onlyDigits(document);

  if (personType === "INDIVIDUAL") {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function isDocumentLengthValid(document: string, personType: PersonType): boolean {
  const digits = onlyDigits(document);
  return personType === "INDIVIDUAL" ? digits.length === 11 : digits.length === 14;
}

export function formatPhone(phone: string): string {
  const digits = onlyDigits(phone);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}
