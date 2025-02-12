import { expect, it } from "vitest";
import { parseDateString } from "../parseDateString.mjs";

describe('parseDateString', () => {
  it('deve retornar a data no formato correto', () => {
    const input = "20/12/2003";
    const result = parseDateString(input);
    expect(result.date.toISOString()).toBe('2003-12-20T00:00:00.000Z');
  });

  it('deve retornar um erro se a string de data for vazia', () => {
    const input = "";
    const result = parseDateString(input);
    expect(result.error).toBe('Formato de data inválido. Use DD/MM/AAAA.');
  });

  it('deve retornar um erro se a data estiver em formato inválido', () => {
    const input = "2003-12-20";
    const result = parseDateString(input);
    expect(result.error).toBe('Formato de data inválido. Use DD/MM/AAAA.');
  });

  it('deve retornar um erro se a data contiver caracteres não numéricos', () => {
    const input = "20/12/abcd";
    const result = parseDateString(input);
    expect(result.error).toBe('Formato de data inválido. Use DD/MM/AAAA.');
  });

  it('deve retornar um erro se a data for inválida', () => {
    const input = "32/12/2003";
    const result = parseDateString(input);
    expect(result.error).toBe('Formato de data inválido. Use DD/MM/AAAA.');
  });
});