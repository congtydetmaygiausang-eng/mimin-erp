import assert from "node:assert/strict";
import test from "node:test";
import { fetchWithSourcingAuth, type SourcingAuthProvider } from "./sourcing-auth-request";

const authProvider = (token: string, refreshedToken = "fresh-token"): SourcingAuthProvider => ({
  async getSession() { return { data: { session: { access_token: token } } }; },
  async refreshSession() { return { data: { session: { access_token: refreshedToken } }, error: null }; },
});

test("uses the current session token", async () => {
  const tokens: string[] = [];
  const response = await fetchWithSourcingAuth(authProvider("current-token"), "/search", {}, async (_input, init) => {
    tokens.push(new Headers(init?.headers).get("Authorization") ?? "");
    return new Response(null, { status: 200 });
  });
  assert.equal(response.status, 200);
  assert.deepEqual(tokens, ["Bearer current-token"]);
});

test("refreshes and retries once after an unauthorized response", async () => {
  const tokens: string[] = [];
  const response = await fetchWithSourcingAuth(authProvider("stale-token"), "/search", {}, async (_input, init) => {
    tokens.push(new Headers(init?.headers).get("Authorization") ?? "");
    return new Response(null, { status: tokens.length === 1 ? 401 : 200 });
  });
  assert.equal(response.status, 200);
  assert.deepEqual(tokens, ["Bearer stale-token", "Bearer fresh-token"]);
});

test("does not retry non-authentication failures", async () => {
  let calls = 0;
  const response = await fetchWithSourcingAuth(authProvider("current-token"), "/search", {}, async () => {
    calls += 1;
    return new Response(null, { status: 422 });
  });
  assert.equal(response.status, 422);
  assert.equal(calls, 1);
});
