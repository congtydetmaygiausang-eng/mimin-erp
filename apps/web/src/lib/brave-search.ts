export interface BraveWebSearchItem {
  title: string;
  url: string;
  description: string;
  extraSnippets: string[];
  rank: number;
  query: string;
}

interface BraveWebSearchResponse {
  web?: {
    results?: Array<{
      title?: unknown;
      url?: unknown;
      description?: unknown;
      extra_snippets?: unknown;
    }>;
  };
}

export interface BraveSearchOptions {
  apiKey: string;
  queries: string[];
  maxQueries?: number;
  resultsPerQuery?: number;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

const BRAVE_WEB_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

function boundedInteger(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(value ?? fallback)));
}

function stringValue(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function stringArray(value: unknown, maximumItems: number, maximumLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maximumLength))
    .filter(Boolean)
    .slice(0, maximumItems);
}

export async function searchBraveWeb(options: BraveSearchOptions): Promise<BraveWebSearchItem[]> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) return [];

  const maximumQueries = boundedInteger(options.maxQueries, 6, 1, 10);
  const resultsPerQuery = boundedInteger(options.resultsPerQuery, 10, 1, 20);
  const timeoutMs = boundedInteger(options.timeoutMs, 12_000, 1_000, 30_000);
  const fetcher = options.fetcher ?? fetch;
  const queries = Array.from(new Set(options.queries.map((query) => query.trim()).filter(Boolean))).slice(0, maximumQueries);

  const batches = await Promise.allSettled(queries.map(async (query) => {
    const params = new URLSearchParams({
      q: `${query} Việt Nam`,
      count: String(resultsPerQuery),
      country: "vn",
      search_lang: "vi",
      safesearch: "moderate",
      spellcheck: "1",
      extra_snippets: "true",
    });
    const response = await fetcher(`${BRAVE_WEB_SEARCH_ENDPOINT}?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Brave HTTP ${response.status}`);

    const data = await response.json() as BraveWebSearchResponse;
    return (data.web?.results ?? []).flatMap((rawItem, rank) => {
      const title = stringValue(rawItem.title, 500);
      const url = stringValue(rawItem.url, 2_000);
      if (!title || !url) return [];
      return [{
        title,
        url,
        description: stringValue(rawItem.description, 4_000),
        extraSnippets: stringArray(rawItem.extra_snippets, 5, 2_000),
        rank,
        query,
      }];
    });
  }));

  if (batches.length && batches.every((batch) => batch.status === "rejected")) {
    const firstFailure = batches.find((batch): batch is PromiseRejectedResult => batch.status === "rejected");
    throw firstFailure?.reason instanceof Error ? firstFailure.reason : new Error("Brave request failed");
  }
  return batches.flatMap((batch) => batch.status === "fulfilled" ? batch.value : []);
}
