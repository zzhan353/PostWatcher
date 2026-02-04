import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import { fetchJson, matchKeywords, shouldSkipKeywordFilter } from "../utils"

interface SerpApiGoogleNewsResponse {
  news_results?: Array<{
    title?: string
    link?: string
    snippet?: string
    source?: string
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
    engine: "google_news",
    q: query,
    api_key: apiKey,
  })
  return `https://serpapi.com/search.json?${params.toString()}`
}

export function createSerpApiGoogleNewsProvider(): Provider {
  return {
    id: "serpapi_google_news",
    label: "Google News (SerpApi)",
    requiresApi: true,
    async run({ keywords, filters }) {
      try {
        const query =
          (filters?.serpapiQuery as string | undefined) ??
          (keywords.length > 0 ? keywords.join(" ") : "technology news")
        const response = await fetchJson<SerpApiGoogleNewsResponse>(
          buildSearchUrl(query),
        )
        const results = response.news_results ?? []
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const items = results
          .map((item) => ({
            title: item.title || "News result",
            description: item.snippet || item.source || "",
            url: item.link,
          }))
          .map((item) => {
            if (skipKeywordFilter) {
              return { ...item, matchedKeywords: keywords }
            }
            const { matchedKeywords } = matchKeywords(item, keywords)
            return { ...item, matchedKeywords }
          })
          .filter((item) => skipKeywordFilter || item.matchedKeywords?.length)

        return {
          source: "serpapi_google_news",
          ok: true,
          message: "Fetched Google News via SerpApi",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "serpapi_google_news",
          ok: false,
          message:
            error instanceof Error ? error.message : "SerpApi request failed",
          items: [],
        }
      }
    },
  }
}
