import { getDatabaseUrlFromUrlAndPassword } from "./database-url";

describe("getDatabaseUrlFromUrlAndPassword", () => {
  describe("with postgres:// protocol", () => {
    it("should use the provided password when both URL password and separate password are present", () => {
      const url = "postgres://user:urlpassword@localhost:5432/mydb";
      const password = "separatepassword";

      const result = getDatabaseUrlFromUrlAndPassword(url, password);

      expect(result).toBe("postgres://user:separatepassword@localhost:5432/mydb");
    });

    it("should use the URL password when no separate password is provided", () => {
      const url = "postgres://user:urlpassword@localhost:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:urlpassword@localhost:5432/mydb");
    });

    it("should add the separate password when URL has no password", () => {
      const url = "postgres://user@localhost:5432/mydb";
      const password = "newpassword";

      const result = getDatabaseUrlFromUrlAndPassword(url, password);

      expect(result).toBe("postgres://user:newpassword@localhost:5432/mydb");
    });

    it("should return URL without password when neither is provided", () => {
      const url = "postgres://user@localhost:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user@localhost:5432/mydb");
    });

    it("should handle URL with default port (no explicit port)", () => {
      const url = "postgres://user:password@localhost/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:password@localhost/mydb");
    });

    it("should encode special characters in the password", () => {
      const url = "postgres://user@localhost:5432/mydb";
      const password = "p@ssw:rd/with$pecial!chars";

      const result = getDatabaseUrlFromUrlAndPassword(url, password);

      expect(result).toBe("postgres://user:p%40ssw%3Ard%2Fwith%24pecial!chars@localhost:5432/mydb");
    });

    it("should handle FQDNs", () => {
      const url = "postgres://user:password@db.example.com:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:password@db.example.com:5432/mydb");
    });

    it("should handle database name with special characters", () => {
      const url = "postgres://user:password@localhost:5432/my-db_name";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:password@localhost:5432/my-db_name");
    });
  });

  describe("with postgresql:// protocol", () => {
    it("should work with postgresql:// protocol", () => {
      const url = "postgresql://user:password@localhost:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgresql://user:password@localhost:5432/mydb");
    });
  });

  describe("error cases", () => {
    it("should throw error for invalid protocol", () => {
      const url = "badvibes://user:password@localhost:3306/mydb";

      expect(() => getDatabaseUrlFromUrlAndPassword(url)).toThrow();
    });

    it("should throw error for missing username", () => {
      const url = "postgres://:password@localhost:5432/mydb";

      expect(() => getDatabaseUrlFromUrlAndPassword(url)).toThrow();
    });

    it("should throw error for missing host", () => {
      const url = "postgres://user:password@/mydb";

      expect(() => getDatabaseUrlFromUrlAndPassword(url)).toThrow();
    });

    it("should throw error for missing pathname", () => {
      const url = "postgres://user:password@localhost:5432";

      expect(() => getDatabaseUrlFromUrlAndPassword(url)).toThrow();
    });

    it("should throw error for completely invalid URL", () => {
      const url = "not-a-valid-url";

      expect(() => getDatabaseUrlFromUrlAndPassword(url)).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty password string as no password", () => {
      const url = "postgres://user@localhost:5432/mydb";
      const password = "";

      const result = getDatabaseUrlFromUrlAndPassword(url, password);

      expect(result).toBe("postgres://user@localhost:5432/mydb");
    });

    it("should preserve IPv6 addresses in host", () => {
      const url = "postgres://user:password@[::1]:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:password@[::1]:5432/mydb");
    });

    it("should handle username with special characters", () => {
      const url = "postgres://user%40example.com:password@localhost:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user%40example.com:password@localhost:5432/mydb");
    });

    it("should handle password in URL with special characters", () => {
      const url = "postgres://user:p%40ssword@localhost:5432/mydb";

      const result = getDatabaseUrlFromUrlAndPassword(url);

      expect(result).toBe("postgres://user:p%2540ssword@localhost:5432/mydb");
    });

    it("should override password with special characters in URL with new password", () => {
      const url = "postgres://user:p%40ssword@localhost:5432/mydb";
      const password = "newpassword";

      const result = getDatabaseUrlFromUrlAndPassword(url, password);

      expect(result).toBe("postgres://user:newpassword@localhost:5432/mydb");
    });
  });
});
