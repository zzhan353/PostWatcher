import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import {
  applyLocationFilter,
  fetchJson,
  matchKeywords,
  shouldSkipKeywordFilter,
} from "../utils"

type RemoteOkResponse = Array<{
  id?: number
  position?: string
  description?: string
  url?: string
  company?: string
}>

export function createRemoteOkProvider(): Provider {
  return {
    id: "remoteok",
    label: "Remote OK",
    requiresApi: false,
    async run({ keywords, filters }) {
      try {
        const response = await fetchJson<RemoteOkResponse>(
          "https://remoteok.com/api",
        )
        const jobs = response.slice(1)
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const items = jobs
          .map((job) => ({
            title: job.position || job.company || "Remote role",
            description: job.description || "",
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
          source: "remoteok",
          ok: true,
          message: "Fetched Remote OK jobs",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "remoteok",
          ok: false,
          message: error instanceof Error ? error.message : "Remote OK failed",
          items: [],
        }
      }
    },
  }
}
