import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import { fetchJson } from "../utils"

interface FinnhubQuoteResponse {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

interface FinnhubEarningsResponse {
  earningsCalendar: Array<{
    date: string
    symbol: string
    epsEstimate?: number
  }>
}

interface FinnhubNewsItem {
  headline: string
  url: string
  datetime: number
  source?: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function buildQuoteUrl(symbol: string) {
  const apiKey = getRequiredEnv("FINNHUB_API_KEY")
  const params = new URLSearchParams({
    symbol,
    token: apiKey,
  })
  return `https://finnhub.io/api/v1/quote?${params.toString()}`
}

function buildEarningsUrl(symbol: string, from: string, to: string) {
  const apiKey = getRequiredEnv("FINNHUB_API_KEY")
  const params = new URLSearchParams({
    symbol,
    from,
    to,
    token: apiKey,
  })
  return `https://finnhub.io/api/v1/calendar/earnings?${params.toString()}`
}

function buildNewsUrl(symbol: string, from: string, to: string) {
  const apiKey = getRequiredEnv("FINNHUB_API_KEY")
  const params = new URLSearchParams({
    symbol,
    from,
    to,
    token: apiKey,
  })
  return `https://finnhub.io/api/v1/company-news?${params.toString()}`
}

function buildYahooFinanceUrl(symbol: string) {
  return `https://finance.yahoo.com/quote/${symbol}`
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "N/A"
  return `$${value.toFixed(2)}`
}

function extractTickers(keywords: string[]) {
  const combined = keywords.join(" ")
  const raw = combined.split(/[^A-Za-z.\-]/).filter(Boolean)
  const tickers = raw
    .map((token) => token.toUpperCase())
    .filter((token) => /^[A-Z.\-]{1,10}$/.test(token))
  return Array.from(new Set(tickers))
}

function getDateRange(days: number) {
  const now = new Date()
  const from = now.toISOString().slice(0, 10)
  const toDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const to = toDate.toISOString().slice(0, 10)
  return { from, to }
}

function isOnOrAfter(date: string, reference: string) {
  return date >= reference
}

export function createFinnhubStocksProvider(): Provider {
  return {
    id: "finnhub_stocks",
    label: "Finnhub Stocks",
    requiresApi: true,
    async run({ keywords }) {
      const tickers = extractTickers(keywords)
      if (!tickers.length) {
        return {
          source: "finnhub_stocks",
          ok: false,
          message: "No valid stock tickers provided",
          items: [],
        }
      }

      const { from, to } = getDateRange(90)
      const { from: newsFrom, to: newsTo } = getDateRange(7)
      const items = []

      for (const symbol of tickers) {
        try {
          const [quote, earnings, news] = await Promise.all([
            fetchJson<FinnhubQuoteResponse>(buildQuoteUrl(symbol)),
            fetchJson<FinnhubEarningsResponse>(
              buildEarningsUrl(symbol, from, to),
            ),
            fetchJson<FinnhubNewsItem[]>(buildNewsUrl(symbol, newsFrom, newsTo)),
          ])

          const upcoming = (earnings.earningsCalendar ?? [])
            .filter((entry) => isOnOrAfter(entry.date, from))
            .sort((a, b) => a.date.localeCompare(b.date))[0]

          if (!upcoming) {
            continue
          }

          const priceLine = `${symbol}: ${formatPrice(quote.c)} (${formatPercent(
            quote.dp || 0,
          )})`
          const earningsLine = `Earnings date: ${upcoming.date}${
            upcoming.epsEstimate ? ` (EPS est. ${upcoming.epsEstimate})` : ""
          }`

          const topNews = (news ?? [])
            .slice(0, 3)
            .map(
              (item) =>
                `- ${item.headline}${
                  item.source ? ` (${item.source})` : ""
                }`,
            )
            .join("\n")

          const description = [
            earningsLine,
            topNews ? "Top news:" : null,
            topNews || null,
          ]
            .filter(Boolean)
            .join("\n")

          items.push({
            title: priceLine,
            description,
            url: buildYahooFinanceUrl(symbol),
            matchedKeywords: [symbol],
          })
        } catch (error) {
          // Skip symbols that fail during reminder runs
        }
      }

      return {
        source: "finnhub_stocks",
        ok: true,
        message: "Fetched upcoming earnings reminders",
        items,
      } satisfies ProviderRunResult
    },
  }
}
