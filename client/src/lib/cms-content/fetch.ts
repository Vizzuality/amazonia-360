/**
 * Reads content collections from the Payload REST API (AM-670).
 *
 * The single most likely defect in this migration lives here: Payload paginates
 * by default and caps a response at 10 documents. Fetching Indicators without
 * disabling that yields 10 of 164, with no error at all — the catalogue just
 * silently loses most of itself. `limit=0` means unlimited, and
 * `assertComplete` refuses to hand back a truncated page even if that changes.
 */

const API_BASE = "/v1/api";

export type ContentCollection = "topics" | "subtopics" | "indicators";

type PaginatedResponse<T> = {
  docs: T[];
  totalDocs?: number;
  hasNextPage?: boolean;
};

/**
 * Fetched at depth 0: relationships come back as numeric ids, which is all the
 * lookups need, and it keeps a 164-record response from ballooning.
 */
export const buildContentUrl = ({
  collection,
  locale,
  baseUrl = API_BASE,
}: {
  collection: ContentCollection;
  locale: string;
  baseUrl?: string;
}): string =>
  `${baseUrl}/${collection}?${new URLSearchParams({
    locale,
    depth: "0",
    // 0 means unlimited. Anything else silently truncates the catalogue.
    limit: "0",
    "fallback-locale": "en",
  }).toString()}`;

/** Guards against a paginated subset being mistaken for the whole collection. */
export const assertComplete = <T>(
  collection: ContentCollection,
  response: PaginatedResponse<T>,
): T[] => {
  const { docs, totalDocs, hasNextPage } = response;

  if (!Array.isArray(docs)) {
    throw new Error(`${collection}: response had no docs array`);
  }

  if (hasNextPage) {
    throw new Error(
      `${collection}: response is paginated (${docs.length} of ${totalDocs ?? "?"}). Pagination must be disabled or the catalogue silently loses records.`,
    );
  }

  if (typeof totalDocs === "number" && docs.length !== totalDocs) {
    throw new Error(`${collection}: got ${docs.length} records but the API reports ${totalDocs}.`);
  }

  return docs;
};

export const fetchContent = async <T>({
  collection,
  locale,
  baseUrl,
  fetchImpl = fetch,
}: {
  collection: ContentCollection;
  locale: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<T[]> => {
  const response = await fetchImpl(buildContentUrl({ collection, locale, baseUrl }));

  if (!response.ok) {
    throw new Error(`${collection}: request failed with ${response.status}`);
  }

  return assertComplete<T>(collection, (await response.json()) as PaginatedResponse<T>);
};
