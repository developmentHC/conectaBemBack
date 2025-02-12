import { testEmailSyntax } from "../testEmailSyntax.mjs";

describe("validarEmail", () => {
  it("deve retornar true para um email válido", () => {
    expect(testEmailSyntax("teste@exemplo.com")).toBe(true);
  });

  it('deve retornar false para um email sem "@"', () => {
    expect(testEmailSyntax("testeexemplo.com")).toBe(false);
  });

  it("deve retornar false para um email sem domínio", () => {
    expect(testEmailSyntax("teste@")).toBe(false);
  });

  it("deve retornar false para um email com espaços", () => {
    expect(testEmailSyntax("teste @exemplo.com")).toBe(false);
  });

  it("deve retornar false para um email sem TLD", () => {
    expect(testEmailSyntax("teste@exemplo")).toBe(false);
  });

  it('deve retornar false para um email com múltiplos "@"', () => {
    expect(testEmailSyntax("teste@@exemplo.com")).toBe(false);
  });
});
