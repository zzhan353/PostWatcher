import { createArbeitnowProvider } from "./jobs/arbeitnow"
import { createRemoteOkProvider } from "./jobs/remoteok"
import { createRemotiveProvider } from "./jobs/remotive"
import { createSerpApiGoogleJobsProvider } from "./jobs/serpapi-google-jobs"
import { createSerpApiGoogleShoppingProvider } from "./shopping/serpapi-google-shopping"
import { createSerpApiGoogleNewsProvider } from "./news/serpapi-google-news"
import { createFinnhubStocksProvider } from "./stocks/finnhub-stocks"

export interface ProviderRunResult {
  source: string
  ok: boolean
  message: string
  items: Array<{
    title: string
    description?: string
    url?: string
    matchedKeywords?: string[]
  }>
}

export interface Provider {
  id: string
  label: string
  requiresApi: boolean
  run: (input: {
    keywords: string[]
    filters?: Record<string, unknown>
  }) => Promise<ProviderRunResult>
}

export function createUnconfiguredProvider(
  id: string,
  label: string,
  requiresApi = true,
): Provider {
  return {
    id,
    label,
    requiresApi,
    async run() {
      return {
        source: id,
        ok: false,
        message: "Provider API not configured",
        items: [],
      }
    },
  }
}

export const providers: Provider[] = [
  createSerpApiGoogleJobsProvider(),
  createSerpApiGoogleShoppingProvider(),
  createSerpApiGoogleNewsProvider(),
  createFinnhubStocksProvider(),
  createRemotiveProvider(),
  createRemoteOkProvider(),
  createArbeitnowProvider(),
  createUnconfiguredProvider("linkedin", "LinkedIn"),
  createUnconfiguredProvider("indeed", "Indeed"),
  createUnconfiguredProvider("zillow", "Zillow"),
  createUnconfiguredProvider("redfin", "Redfin"),
]
