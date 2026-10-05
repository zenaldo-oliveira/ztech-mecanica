import type { ContactPreference, PersonType } from "@/lib/api/customers";

export const personTypeLabels: Record<PersonType, string> = {
  INDIVIDUAL: "Pessoa Física",
  BUSINESS: "Pessoa Jurídica",
};

export const personTypeOptions: { value: PersonType; label: string }[] = [
  { value: "INDIVIDUAL", label: "Pessoa Física" },
  { value: "BUSINESS", label: "Pessoa Jurídica" },
];

export const contactPreferenceLabels: Record<ContactPreference, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  NONE: "Nenhuma",
};

export const contactPreferenceOptions: { value: ContactPreference; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "NONE", label: "Nenhuma" },
];
