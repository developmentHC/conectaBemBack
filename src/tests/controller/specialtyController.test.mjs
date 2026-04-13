import { describe, expect, it, vi } from "vitest";
import { getSpecialties } from "../../controller/specialtyController";

describe("GET /specialties", () => {
  it("should return 200 and specialties list", () => {
    const req = {};

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      set: vi.fn(),
    };

    getSpecialties(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();

    const data = res.json.mock.calls[0][0];

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(20);

    data.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
    });
  });
});
