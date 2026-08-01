/* ==========================================================================
   /healthz — the endpoint the Dockerfile HEALTHCHECK, the deploy script and
   the CI smoke test all depend on. If this breaks, deploys break silently.
   ========================================================================== */

const request = require("supertest");
const app = require("../server");
const pool = require("../config/db");

// server.js only calls app.listen() when run directly, so requiring it here
// gives us the Express app without binding a port. Supertest starts its own
// ephemeral listener per request.
afterAll(async () => {
  await pool.end();
});

describe("GET /healthz", () => {
  it("returns 200 when the database is reachable", async () => {
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("up");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("does not require a session", async () => {
    // It is declared before the session middleware on purpose — this test
    // stops someone "tidying up" server.js and moving it below.
    const res = await request(app).get("/healthz");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});
