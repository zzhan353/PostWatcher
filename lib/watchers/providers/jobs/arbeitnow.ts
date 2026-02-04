import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import {
  applyLocationFilter,
  fetchJson,
  matchKeywords,
  shouldSkipKeywordFilter,
} from "../utils"

interface ArbeitnowResponse {
  data: Array<{
    title: string
    description: string
    url: string
    location?: string
  }>
}

export function createArbeitnowProvider(): Provider {
  return {
    id: "arbeitnow",
    label: "Arbeitnow",
    requiresApi: false,
    async run({ keywords, filters }) {
      try {
        const response = await fetchJson<ArbeitnowResponse>(
          "https://www.arbeitnow.com/api/job-board-api",
        )
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const items = response.data
          .map((job) => ({
            title: job.title,
            description: job.description,
            url: job.url,
          }))
          .filter((job) => applyLocationFilter(job, filters))
          .map((job) => {
            if (skipKeywordFilter) {
              return { ...job, matchedKeywords: keywords }
            }
            const { matchedKeywords } = matchKeywords(job, keywords)
            return { ...job, matchedKeywords }
          })
          .filter((job) => skipKeywordFilter || job.matchedKeywords?.length)

        return {
          source: "arbeitnow",
          ok: true,
          message: "Fetched Arbeitnow jobs",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "arbeitnow",
          ok: false,
          message: error instanceof Error ? error.message : "Arbeitnow failed",
          items: [],
        }
      }
    },
  }
}
