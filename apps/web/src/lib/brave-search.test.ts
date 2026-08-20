import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchBraveWeb } from "./brave-search";

interface RecordedCall {
  url: URL;
  headers: Headers;
}

function response(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function successfulResponse(title = "Công ty A"): Response {
  return response(200, {
    web: { results: [{ title, url: `https://example.vn/${encodeURIComponent(title)}` }] },
  });
}

describe("searchBraveWeb", () => {
  it("retries a 422 response once with minimal parameters and preserves Vietnam location", async () => {
    const calls: RecordedCall[] = [];
    const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
      return calls.length === 1 ? response(422, { error: "invalid parameter" }) : successfulResponse();
    }) as typeof fetch;

    const results = await searchBraveWeb({ apiKey: "test-key", queries: ["vải cotton"], fetcher });

    assert.equal(results.length, 1);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url.searchParams.has("country"), false);
    assert.deepEqual([...calls[1].url.searchParams.keys()], ["q", "count"]);
    assert.equal(calls[0].headers.get("X-Loc-Country"), "VN");
    assert.equal(calls[1].headers.get("X-Loc-Country"), "VN");
    assert.equal(calls[1].headers.get("X-Subscription-Token"), "test-key");
  });

  for (const status of [401, 403, 429, 500]) {
    it(`does not retry HTTP ${status}`, async () => {
      let callCount = 0;
      const fetcher = (async () => {
        callCount += 1;
        return response(status);
      }) as typeof fetch;

      await assert.rejects(
        searchBraveWeb({ apiKey: "test-key", queries: ["vải cotton"], fetcher }),
        new RegExp(`Brave HTTP ${status}`),
      );
      assert.equal(callCount, 1);
    });
  }

  it("limits the Brave query to 400 characters and 50 words", async () => {
    let requestedUrl: URL | undefined;
    const fetcher = (async (input: string | URL | Request) => {
      requestedUrl = new URL(String(input));
      return successfulResponse();
    }) as typeof fetch;
    const longQuery = Array.from({ length: 80 }, (_, index) => `keyword-${index}`).join(" ");

    await searchBraveWeb({ apiKey: "test-key", queries: [longQuery], fetcher });

    const query = requestedUrl?.searchParams.get("q") ?? "";
    assert.ok(query.length <= 400);
    assert.ok(query.split(/\s+/u).length <= 50);
  });

  it("keeps successful query batches when another query fails", async () => {
    const fetcher = (async (input: string | URL | Request) => {
      const query = new URL(String(input)).searchParams.get("q") ?? "";
      return query.includes("thất bại") ? response(500) : successfulResponse("Công ty thành công");
    }) as typeof fetch;

    const results = await searchBraveWeb({
      apiKey: "test-key",
      queries: ["truy vấn thất bại", "truy vấn thành công"],
      fetcher,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].title, "Công ty thành công");
  });

  it("supports sixteen distinct area queries for a 50 km search", async () => {
    let callCount = 0;
    const fetcher = (async () => {
      callCount += 1;
      return successfulResponse(`Công ty ${callCount}`);
    }) as typeof fetch;

    const results = await searchBraveWeb({
      apiKey: "test-key",
      queries: Array.from({ length: 20 }, (_, index) => `vải cotton khu vực ${index}`),
      maxQueries: 16,
      fetcher,
    });

    assert.equal(callCount, 16);
    assert.equal(results.length, 16);
  });
});
