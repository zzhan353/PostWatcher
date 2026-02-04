import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import { fetchJson, matchKeywords, shouldSkipKeywordFilter } from "../utils"

interface SerpApiGoogleShoppingResponse {
  shopping_results?: Array<{
    title?: string
    link?: string
    product_link?: string
    serpapi_product_api?: string
    source?: string
    price?: string
  }>
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function buildSearchUrl(query: string) {
  const apiKey = getRequiredEnv("SERPAPI_API_KEY")
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
  })
  return `https://serpapi.com/search.json?${params.toString()}`
}

function isValidUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
}

function findFirstUrl(value: unknown): string | undefined {
  if (typeof value === "string" && isValidUrl(value)) {
    return value
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstUrl(item)
      if (found) return found
    }
  } else if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const found = findFirstUrl(entry)
      if (found) return found
    }
  }
  return undefined
}

async function resolveShoppingLink(
  item: SerpApiGoogleShoppingResponse["shopping_results"][number],
) {
  if (item.link && isValidUrl(item.link)) return item.link
  if (item.product_link && isValidUrl(item.product_link)) return item.product_link
  if (item.serpapi_product_api && isValidUrl(item.serpapi_product_api)) {
    const data = await fetchJson<Record<string, unknown>>(
      item.serpapi_product_api,
    )
    return findFirstUrl(data)
  }
  return undefined
}

export function createSerpApiGoogleShoppingProvider(): Provider {
  return {
    id: "serpapi_google_shopping",
    label: "Google Shopping (SerpApi)",
    requiresApi: true,
    async run({ keywords, filters }) {
      try {
        const location = (filters?.serpapiLocation as string | undefined) ??
          (filters?.location as string | undefined)
        const baseQuery =
          (filters?.serpapiQuery as string | undefined) ??
          (keywords.length > 0 ? keywords.join(" ") : "used scooter")
        const query = location ? `${baseQuery} ${location}` : baseQuery
        const response = await fetchJson<SerpApiGoogleShoppingResponse>(
          buildSearchUrl(query),
        )
        const results = response.shopping_results ?? []
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const resolvedItems = await Promise.all(
          results.slice(0, 50).map(async (item) => {
            const url = await resolveShoppingLink(item)
            if (!url) return null
            return {
              title: item.title || "Shopping result",
              description: item.price
                ? `${item.price} · ${item.source ?? ""}`
                : "",
              url,
            }
          }),
        )

        const items = resolvedItems
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((item) => {
            if (skipKeywordFilter) {
              return { ...item, matchedKeywords: keywords }
            }
            const { matchedKeywords } = matchKeywords(item, keywords)
            return { ...item, matchedKeywords }
          })
          .filter((item) => skipKeywordFilter || item.matchedKeywords?.length)

        return {
          source: "serpapi_google_shopping",
          ok: true,
          message: "Fetched Google Shopping via SerpApi",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "serpapi_google_shopping",
          ok: false,
          message:
            error instanceof Error ? error.message : "SerpApi request failed",
          items: [],
        }
      }
    },
  }
}
