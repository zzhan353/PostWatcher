export interface WatcherSourceMeta {
  id: string
  label: string
  requiresApi: boolean
}

export const watcherSources: WatcherSourceMeta[] = [
  { id: "serpapi_google_jobs", label: "Google Jobs (SerpApi)", requiresApi: true },
  { id: "serpapi_google_shopping", label: "Google Shopping (SerpApi)", requiresApi: true },
  { id: "serpapi_google_news", label: "Google News (SerpApi)", requiresApi: true },
  { id: "finnhub_stocks", label: "Finnhub Stocks", requiresApi: true },
  { id: "remotive", label: "Remotive", requiresApi: false },
  { id: "remoteok", label: "Remote OK", requiresApi: false },
  { id: "arbeitnow", label: "Arbeitnow", requiresApi: false },
  { id: "linkedin", label: "LinkedIn", requiresApi: true },
  { id: "indeed", label: "Indeed", requiresApi: true },
  { id: "zillow", label: "Zillow", requiresApi: true },
  { id: "redfin", label: "Redfin", requiresApi: true },
]

export function getWatcherSource(id: string) {
  return watcherSources.find((source) => source.id === id) ?? null
}
