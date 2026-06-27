import { toSafeUser, getUserAgentString } from "../src/utils/user.util";

describe("User utils", () => {
  describe("toSafeUser", () => {
    it("returns only the public user fields", () => {
      const user = {
        id: "user-1",
        email: "user@example.com",
        username: "demo",
        role: "USER" as const,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        password: "secret",
        isVerified: false,
        isDeleted: false,
      };

      expect(toSafeUser(user)).toEqual({
        id: "user-1",
        email: "user@example.com",
        username: "demo",
        role: "USER",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
    });
  });

  describe("getUserAgentString", () => {
    it("formats browser and OS information", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

      expect(getUserAgentString(userAgent)).toBe("Chrome (Windows)");
    });

    it("falls back to default labels when parser data is missing", () => {
      expect(getUserAgentString("")).toBe("Unknown Browser (Unknown OS)");
    });
  });
});
