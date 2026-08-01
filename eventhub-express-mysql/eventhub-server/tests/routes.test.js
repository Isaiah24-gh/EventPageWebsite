/* ==========================================================================
   Route smoke tests — every public page renders, and the guards actually
   guard. Broad and shallow on purpose: this is the safety net that catches
   "someone renamed a view and every page 500s".
   ========================================================================== */

const request = require("supertest");
const app = require("../server");
const pool = require("../config/db");

afterAll(async () => {
  await pool.end();
});

describe("Public pages render", () => {
  it.each([
    ["/", "homepage"],
    ["/login", "login"],
    ["/register", "register"],
  ])("GET %s returns 200 (%s)", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("renders the 404 page for an unknown path", async () => {
    const res = await request(app).get("/no-such-page-exists");
    expect(res.status).toBe(404);
  });
});

describe("Homepage search and filter", () => {
  it("accepts query parameters without erroring", async () => {
    const res = await request(app)
      .get("/")
      .query({ search: "anime", category: "", price: "free" });
    expect(res.status).toBe(200);
  });

  it("does not fall over on a SQL-ish search string", async () => {
    // Queries are parameterised — this should return an empty list, not a 500.
    const res = await request(app).get("/").query({ search: "' OR 1=1 --" });
    expect(res.status).toBe(200);
  });
});

describe("Access control", () => {
  it("redirects anonymous users away from /admin", async () => {
    const res = await request(app).get("/admin");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  it("redirects anonymous users away from /account", async () => {
    const res = await request(app).get("/account");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});

describe("Login", () => {
  it("rejects a wrong password", async () => {
    const res = await request(app)
      .post("/login")
      .type("form")
      .send({ email: "admin@eventhub.local", password: "definitely-wrong" });

    // Failure path is a redirect back to /login with a flash message.
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  it("accepts the seeded admin credentials", async () => {
    const res = await request(app)
      .post("/login")
      .type("form")
      .send({ email: "admin@eventhub.local", password: "admin123" });

    expect(res.status).toBe(302);
    expect(res.headers.location).not.toBe("/login");
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});
