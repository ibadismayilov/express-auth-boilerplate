import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../src/errors/custom.error";

describe("Error Utils", () => {
  describe("createAppError", () => {
    it("should create an error with correct properties", () => {
      const error = new BadRequestError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it("should set status to fail for 4xx errors", () => {
      const error = new BadRequestError("Bad request");
      expect(error.status).toBe("fail");
    });

    it("should set status to error for 5xx errors", () => {
      const error = new InternalServerError("Server error");
      expect(error.status).toBe("error");
    });

    it("should mark error as operational", () => {
      const error = new UnauthorizedError("Test error");
      expect(error.isOperational).toBe(true);
    });
  });
});
