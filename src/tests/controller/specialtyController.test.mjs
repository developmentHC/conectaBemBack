import { describe, expect, it, vi } from "vitest";
import { getSpecialties, SPECIALTIES } from "../../controller/specialtyController";

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
  set: vi.fn(),
});

describe("GET /specialties", () => {
  it("returns 200 with paginated payload and full list on first page", () => {
    const req = { query: {} };
    const res = makeRes();

    getSpecialties(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];

    expect(data).toHaveProperty("specialties");
    expect(data).toHaveProperty("page", 1);
    expect(data).toHaveProperty("pageCount", Math.ceil(SPECIALTIES.length / 10));
    expect(Array.isArray(data.specialties)).toBe(true);
    expect(data.specialties.length).toBe(10);

    data.specialties.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("featured");
    });
  });

  it("returns the remaining items on page 2", () => {
    const req = { query: { page: "2" } };
    const res = makeRes();

    getSpecialties(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.page).toBe(2);
    expect(data.specialties.length).toBe(SPECIALTIES.length - 10);
  });

  it("clamps page > pageCount to the last page", () => {
    const req = { query: { page: "999" } };
    const res = makeRes();

    getSpecialties(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.page).toBe(data.pageCount);
  });

  it("returns 400 when page is not a positive integer", () => {
    const req = { query: { page: "-1" } };
    const res = makeRes();

    getSpecialties(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Página inválida" });
  });

  it("returns only featured specialties when featured=true", () => {
    const req = { query: { featured: "true" } };
    const res = makeRes();

    getSpecialties(req, res);

    const data = res.json.mock.calls[0][0];
    const expectedFeatured = SPECIALTIES.filter((s) => s.featured);

    expect(data.specialties.length).toBe(expectedFeatured.length);
    data.specialties.forEach((item) => {
      expect(item.featured).toBe(true);
    });
  });

  it("ignores featured filter when value is not 'true'", () => {
    const req = { query: { featured: "1" } };
    const res = makeRes();

    getSpecialties(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.pageCount).toBe(Math.ceil(SPECIALTIES.length / 10));
  });
});
