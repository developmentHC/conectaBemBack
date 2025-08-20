import testEmailSyntax from "../../utils/testEmailSyntax.mjs";

describe("testEmailSyntax", () => {
  it("aceita e-mails válidos", () => {
    const valid = ["user@example.com", "first.last@domain.co", "user+tag@gmail.com"];
    valid.forEach((email) => {
      expect(testEmailSyntax(email)).toBe(true);
    });
  });

  it("rejeita e-mails inválidos", () => {
    const invalid = ["user@", "user@.com", "@example.com", "user@@example.com", "plainaddress"];
    invalid.forEach((email) => {
      expect(testEmailSyntax(email)).toBe(false);
    });
  });
});
