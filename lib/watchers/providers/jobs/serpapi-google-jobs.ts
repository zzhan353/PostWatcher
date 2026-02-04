import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import {
  applyLocationFilter,
  fetchJson,
  matchKeywords,
  shouldSkipKeywordFilter,
} from "../utils"

interface SerpApiGoogleJobsResponse {
  jobs_results?: Array<{
    title?: string
    company_name?: string
    location?: string
    description?: string
    job_id?: string
    related_links?: Array<{ link?: string }>
    apply_options?: Array<{ link?: string }>
    share_link?: string
  }>
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function buildSearchUrl(query: string, location?: string) {
  const apiKey = getRequiredEnv("SERPAPI_API_KEY")
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: query,
    api_key: apiKey,
  })
  if (location) {
    params.set("location", location)
  }
  return `https://serpapi.com/search.json?${params.toString()}`
}

function resolveJobUrl(job: SerpApiGoogleJobsResponse["jobs_results"][number]) {
  return (
    job?.apply_options?.[0]?.link ||
    job?.related_links?.[0]?.link ||
    job?.share_link
  )
}

export function createSerpApiGoogleJobsProvider(): Provider {
  return {
    id: "serpapi_google_jobs",
    label: "Google Jobs (SerpApi)",
    requiresApi: true,
    async run({ keywords, filters }) {
      try {
        const query =
          (filters?.serpapiQuery as string | undefined) ??
          (keywords.length > 0 ? keywords.join(" ") : "software engineer")
        const location =
          ((filters?.serpapiLocation as string | undefined) ??
            (filters?.location as string | undefined))?.trim()
        const response = await fetchJson<SerpApiGoogleJobsResponse>(
          buildSearchUrl(query, location),
        )
        const results = response.jobs_results ?? []
        const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)
        const items = results
          .map((job) => ({
            title: job.title || "Job opening",
            description: job.description || job.company_name || "",
            url: resolveJobUrl(job),
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
          source: "serpapi_google_jobs",
          ok: true,
          message: "Fetched Google Jobs via SerpApi",
          items,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "serpapi_google_jobs",
          ok: false,
          message:
            error instanceof Error ? error.message : "SerpApi request failed",
          items: [],
        }
      }
    },
  }
}
