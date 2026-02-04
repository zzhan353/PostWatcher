import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import {
  applyLocationFilter,
  fetchJson,
  matchKeywords,
  shouldSkipKeywordFilter,
} from "../utils"

interface RemotiveResponse {
  jobs: Array<{
    id: number
    title: string
    description: string
    url: string
    category: string
    candidate_required_location?: string
  }>
}

function buildSearchUrl(keywords: string[]) {
  const search = keywords[0]?.trim()
  if (!search) return "https://remotive.com/api/remote-jobs"
  return `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
    search,
  )}`
}

export function createRemotiveProvider(): Provider {
  return {
    id: "remotive",
    label: "Remotive",
    requiresApi: false,
    async run({ keywords, filters }) {
      try {
        const response = await fetchJson<RemotiveResponse>(
          buildSearchUrl(keywords),
        )
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const items = response.jobs
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
          source: "remotive",
          ok: true,
          message: "Fetched Remotive jobs",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "remotive",
          ok: false,
          message: error instanceof Error ? error.message : "Remotive failed",
          items: [],
        }
      }
    },
  }
}
