import { describe, expect, it } from "vitest";

import { documentDigits, documentIssue, isValidCnpj, isValidCpf } from "../src/document.js";

describe("CPF", () => {
  it("aceita CPF válido conhecido, com e sem pontuação", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf(" 529 982 247 25 ")).toBe(true);
    expect(isValidCpf("123.456.789-09")).toBe(true);
  });

  it("recusa dígitos verificadores incorretos", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("529.982.247-15")).toBe(false);
    expect(isValidCpf("456.789.123-03")).toBe(false);
  });

  it("recusa todos os dígitos iguais", () => {
    for (let digit = 0; digit <= 9; digit += 1) {
      expect(isValidCpf(String(digit).repeat(11)), String(digit)).toBe(false);
    }
  });

  it("recusa entrada incompleta, longa ou vazia", () => {
    expect(isValidCpf("529.982.247-2")).toBe(false);
    expect(isValidCpf("529982247251")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("aceita CNPJ válido conhecido, com e sem pontuação", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("recusa dígitos verificadores incorretos", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("11.222.333/0001-71")).toBe(false);
  });

  it("recusa todos os dígitos iguais", () => {
    for (let digit = 0; digit <= 9; digit += 1) {
      expect(isValidCnpj(String(digit).repeat(14)), String(digit)).toBe(false);
    }
  });

  it("recusa entrada incompleta ou vazia", () => {
    expect(isValidCnpj("11.222.333/0001-8")).toBe(false);
    expect(isValidCnpj("")).toBe(false);
  });
});

describe("documentIssue (por tipo de pessoa)", () => {
  it("devolve null para documento válido do tipo certo", () => {
    expect(documentIssue("INDIVIDUAL", "529.982.247-25")).toBeNull();
    expect(documentIssue("BUSINESS", "11.222.333/0001-81")).toBeNull();
  });

  it("explica tamanho errado e dígitos inválidos sem repetir o número", () => {
    expect(documentIssue("INDIVIDUAL", "11.222.333/0001-81")).toBe("CPF deve ter 11 dígitos.");
    expect(documentIssue("BUSINESS", "529.982.247-25")).toBe("CNPJ deve ter 14 dígitos.");
    expect(documentIssue("INDIVIDUAL", "")).toBe("CPF deve ter 11 dígitos.");

    const invalid = documentIssue("INDIVIDUAL", "529.982.247-24");
    expect(invalid).toBe("CPF inválido: confira os dígitos.");
    expect(invalid).not.toContain("529");
    expect(documentIssue("BUSINESS", "00.000.000/0000-00")).toBe("CNPJ inválido: confira os dígitos.");
  });

  it("documentDigits normaliza para o formato do backend (somente dígitos)", () => {
    expect(documentDigits("529.982.247-25")).toBe("52998224725");
    expect(documentDigits("11.222.333/0001-81")).toBe("11222333000181");
  });
});
