import { z } from "zod"

import { createAzureChatCompletion } from "@/lib/ai/azure-openai"

const salaryRangeSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  })
  .strip()

const priceRangeSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  })
  .strip()

const watcherFiltersSchema = z
  .object({
    location: z.string().optional(),
    salaryRange: salaryRangeSchema.optional(),
    priceRange: priceRangeSchema.optional(),
  })
  .strip()
  .default({})

export const watcherSpecSchema = z
  .object({
    name: z.string().min(1),
    category: z.enum([
      "jobs",
      "shopping",
      "real_estate",
      "stocks",
      "social_media",
      "news",
    ]),
    keywords: z.array(z.string().min(1)).min(1),
    sources: z.array(z.string().min(1)).default([]),
    filters: watcherFiltersSchema,
  })
  .strip()

export type WatcherSpec = z.infer<typeof watcherSpecSchema>
export interface WatcherSummaryInput {
  name: string
  category: WatcherSpec["category"]
  keywords: string[]
  sourceUrl?: string
  filters?: Record<string, unknown>
}

function stripCodeFences(input: string) {
  return input
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim()
}

function safeJsonParse<T>(input: string): T {
  const cleaned = stripCodeFences(input)
  return JSON.parse(cleaned) as T
}

function normalizeWatcherSpec(spec: WatcherSpec): WatcherSpec {
  const keywords = spec.keywords.map((keyword) => keyword.trim()).filter(Boolean)
  const sources = (spec.sources ?? [])
    .map((source) => source.trim())
    .filter(Boolean)

  return {
    ...spec,
    keywords,
    sources,
    filters: spec.filters ?? {},
  }
}

function buildWatcherSpecPrompt(userPrompt: string) {
  return [
    "You are an assistant that converts a natural language request into a watcher specification.",
    "Return ONLY a JSON object that matches this schema:",
    `{
  "name": string,
  "category": "jobs" | "shopping" | "real_estate" | "stocks" | "social_media" | "news",
  "keywords": string[],
  "sources": string[],
  "filters": {
    "location"?: string,
    "salaryRange"?: { "min"?: number, "max"?: number, "currency"?: string },
    "priceRange"?: { "min"?: number, "max"?: number, "currency"?: string }
  }
}`,
    "Only include fields that are supported by the schema. Do not include explanations.",
    `User request: ${userPrompt}`,
  ].join("\n")
}

export async function parseWatcherSpecFromPrompt(userPrompt: string) {
  const content = await createAzureChatCompletion(
    [
      { role: "system", content: "You output strict JSON only." },
      { role: "user", content: buildWatcherSpecPrompt(userPrompt) },
    ],
    { temperature: 1, responseFormat: "json_object" },
  )

  const parsed = safeJsonParse<WatcherSpec>(content)
  const spec = watcherSpecSchema.parse(parsed)
  return normalizeWatcherSpec(spec)
}

const serpApiPlanSchema = z
  .object({
    engine: z.enum(["google_jobs", "google_shopping", "google_news"]),
    query: z.string().min(1),
    location: z.string().optional(),
  })
  .strip()

export type SerpApiPlan = z.infer<typeof serpApiPlanSchema>

function buildSerpApiPlanPrompt(input: {
  name: string
  category: WatcherSpec["category"]
  keywords: string[]
  filters?: Record<string, unknown>
}) {
  return [
    "Decide which SerpApi Google engine to use for this watcher.",
    "Use ONLY one of: google_jobs, google_shopping, google_news.",
    "Return JSON with: engine, query, and optional location.",
    "Choose based on category and keywords.",
    `Watcher name: ${input.name}`,
    `Category: ${input.category}`,
    `Keywords: ${input.keywords.join(", ")}`,
    `Filters: ${JSON.stringify(input.filters ?? {})}`,
  ].join("\n")
}

export async function generateSerpApiPlan(input: {
  name: string
  category: WatcherSpec["category"]
  keywords: string[]
  filters?: Record<string, unknown>
}) {
  const content = await createAzureChatCompletion(
    [
      { role: "system", content: "You output strict JSON only." },
      { role: "user", content: buildSerpApiPlanPrompt(input) },
    ],
    { temperature: 1, responseFormat: "json_object" },
  )

  const parsed = safeJsonParse<SerpApiPlan>(content)
  return serpApiPlanSchema.parse(parsed)
}

function buildWatcherSummaryPrompt(input: WatcherSummaryInput) {
  return [
    "You are a helpful assistant that summarizes a new watcher setup for the user.",
    "Keep it concise and actionable. Use plain text, no markdown.",
    "Include: watcher name, category, keywords, source URL (if any), and any filters.",
    "End with a short line about when they will receive notifications.",
    `Watcher name: ${input.name}`,
    `Category: ${input.category}`,
    `Keywords: ${input.keywords.join(", ")}`,
    `Source URL: ${input.sourceUrl || "default sources"}`,
    `Filters: ${JSON.stringify(input.filters ?? {})}`,
  ].join("\n")
}

export async function generateWatcherSummary(input: WatcherSummaryInput) {
  return createAzureChatCompletion(
    [
      { role: "system", content: "You output plain text only." },
      { role: "user", content: buildWatcherSummaryPrompt(input) },
    ],
    { temperature: 1, responseFormat: "text" },
  )
}

export interface NotificationDigestInput {
  watcherName: string
  items: Array<{ title: string; url?: string }>
}

function buildNotificationDigestPrompt(input: NotificationDigestInput) {
  const lines = input.items.map((item, index) => {
    const url = item.url ? ` | ${item.url}` : ""
    return `${index + 1}. ${item.title}${url}`
  })
  return [
    "You format a short, friendly email notification for new job matches.",
    "Return plain text only.",
    "Start with a one-line summary, then a numbered list of jobs.",
    "Keep it concise and readable. No markdown.",
    `Watcher: ${input.watcherName}`,
    "Jobs:",
    ...lines,
  ].join("\n")
}

export async function generateNotificationDigest(
  input: NotificationDigestInput,
) {
  return createAzureChatCompletion(
    [
      { role: "system", content: "You output plain text only." },
      { role: "user", content: buildNotificationDigestPrompt(input) },
    ],
    { temperature: 1, responseFormat: "text" },
  )
}

export interface NotificationIntroInput {
  watcherName: string
  titles: string[]
}

function buildNotificationIntroPrompt(input: NotificationIntroInput) {
  return [
    "Write a short, friendly 1-2 sentence intro for a job alert email.",
    "Keep it concise and upbeat. No markdown.",
    `Watcher: ${input.watcherName}`,
    `Sample roles: ${input.titles.slice(0, 5).join(", ")}`,
  ].join("\n")
}

export async function generateNotificationIntro(
  input: NotificationIntroInput,
) {
  return createAzureChatCompletion(
    [
      { role: "system", content: "You output plain text only." },
      { role: "user", content: buildNotificationIntroPrompt(input) },
    ],
    { temperature: 1, responseFormat: "text" },
  )
}

const stockRiskNotesSchema = z
  .object({
    notes: z.array(
      z.object({
        symbol: z.string().min(1),
        riskNote: z.string().min(1),
      }),
    ),
  })
  .strip()

export type StockRiskNotes = z.infer<typeof stockRiskNotesSchema>

function buildStockRiskPrompt(input: {
  watcherName: string
  items: Array<{ symbol: string; summary: string }>
}) {
  const lines = input.items.map(
    (item) => `- ${item.symbol}: ${item.summary}`,
  )
  return [
    "You are a neutral assistant summarizing market risk factors.",
    "Return JSON only with a list of riskNote per symbol.",
    "Do NOT give buy/sell/hold advice or price targets.",
    "Focus on volatility, upcoming earnings, and uncertainty.",
    `Watcher: ${input.watcherName}`,
    "Items:",
    ...lines,
  ].join("\n")
}

export async function generateStockRiskNotes(input: {
  watcherName: string
  items: Array<{ symbol: string; summary: string }>
}) {
  const content = await createAzureChatCompletion(
    [
      { role: "system", content: "You output strict JSON only." },
      { role: "user", content: buildStockRiskPrompt(input) },
    ],
    { temperature: 1, responseFormat: "json_object" },
  )
  const parsed = safeJsonParse<StockRiskNotes>(content)
  return stockRiskNotesSchema.parse(parsed)
}

const stockInsightsSchema = z
  .object({
    insights: z.array(
      z.object({
        symbol: z.string().min(1),
        analysis: z.string().min(1),
        risk: z.string().min(1),
      }),
    ),
  })
  .strip()

export type StockInsights = z.infer<typeof stockInsightsSchema>

function buildStockInsightsPrompt(input: {
  watcherName: string
  items: Array<{
    symbol: string
    priceLine: string
    earningsLine?: string
    newsHeadlines: string[]
  }>
}) {
  const lines = input.items.map((item) => {
    const news = item.newsHeadlines.slice(0, 3).join(" | ")
    return `- ${item.symbol}: ${item.priceLine}; ${item.earningsLine || "Earnings: unknown"}; News: ${news}`
  })
  return [
    "You are a neutral market summary assistant.",
    "Return JSON only with an analysis and risk note per symbol.",
    "Do NOT give buy/sell/hold advice or price targets.",
    "Analysis must mention the price line and at least one news item or earnings info.",
    "Risk should be 1 short sentence tied to earnings timing or headline uncertainty.",
    `Watcher: ${input.watcherName}`,
    "Items:",
    ...lines,
  ].join("\n")
}

export async function generateStockInsights(input: {
  watcherName: string
  items: Array<{
    symbol: string
    priceLine: string
    earningsLine?: string
    newsHeadlines: string[]
  }>
}) {
  const fallbackInsights: StockInsights = {
    insights: input.items.map((item) => {
      const headline = item.newsHeadlines[0]
      const analysisParts = [
        item.priceLine,
        item.earningsLine || "Earnings timing unknown",
        headline ? `Headline: ${headline}` : "No recent headline found",
      ]
      return {
        symbol: item.symbol,
        analysis: analysisParts.join(". ") + ".",
        risk: item.earningsLine
          ? "Risk: Earnings-related volatility may remain elevated."
          : "Risk: Headline-driven swings and broader market moves can add volatility.",
      }
    }),
  }

  try {
    const content = await createAzureChatCompletion(
      [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: buildStockInsightsPrompt(input) },
      ],
      { temperature: 1, responseFormat: "json_object" },
    )
    const parsed = safeJsonParse<StockInsights>(content)
    const validated = stockInsightsSchema.parse(parsed)
    if (!validated.insights.length) {
      return fallbackInsights
    }
    return validated
  } catch {
    try {
      const text = await createAzureChatCompletion(
        [
          { role: "system", content: "You output plain text only." },
          {
            role: "user",
            content:
              buildStockInsightsPrompt(input) +
              "\nReturn plain text with one line per symbol: SYMBOL - analysis. Risk: <risk>.",
          },
        ],
        { temperature: 1, responseFormat: "text" },
      )
      const insights = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^([A-Z.\-]{1,10})\s*-\s*(.+)$/)
          if (!match) return null
          const symbol = match[1]
          const rest = match[2]
          const [analysisPart, riskPart] = rest.split(/Risk:\s*/i)
          return {
            symbol,
            analysis: (analysisPart || "").trim() || "Market update available.",
            risk: (riskPart || "").trim() || "Risk: Market volatility applies.",
          }
        })
        .filter((item): item is StockInsights["insights"][number] => !!item)

      if (insights.length > 0) {
        return { insights }
      }
    } catch {
      // ignore
    }
  }

  return fallbackInsights
}

export interface StockBriefingInput {
  watcherName: string
  items: Array<{
    symbol: string
    priceLine: string
    earningsLine?: string
    newsHeadlines: string[]
  }>
}

function buildStockBriefingPrompt(input: StockBriefingInput) {
  const lines = input.items.map((item) => {
    const news = item.newsHeadlines.slice(0, 3).join(" | ")
    return `- ${item.symbol}: ${item.priceLine}; ${item.earningsLine || "Earnings: unknown"}; News: ${news}`
  })
  return [
    "You are a neutral market briefing assistant.",
    "Write a short morning brief with a 2-3 sentence overview, then 1 short paragraph per symbol.",
    "Do NOT give buy/sell/hold advice or price targets.",
    "Mention price moves, upcoming earnings, and notable headlines.",
    "Keep it concise and readable. Plain text only.",
    `Watcher: ${input.watcherName}`,
    "Items:",
    ...lines,
  ].join("\n")
}

export async function generateStockBriefing(input: StockBriefingInput) {
  const fallbackLines = [
    `Morning brief for ${input.watcherName}:`,
    ...input.items.map((item) => {
      const news = item.newsHeadlines.slice(0, 3).join(" | ")
      return `${item.symbol} — ${item.priceLine}. ${item.earningsLine || "Earnings: unknown"}. ${
        news ? `News: ${news}.` : ""
      }`
    }),
  ]

  try {
    const content = await createAzureChatCompletion(
      [
        { role: "system", content: "You output plain text only." },
        { role: "user", content: buildStockBriefingPrompt(input) },
      ],
      { temperature: 1, responseFormat: "text" },
    )
    if (content && content.trim()) {
      return content.trim()
    }
  } catch {
    // ignore
  }

  return fallbackLines.join("\n")
}

export interface DailyDigestInput {
  dateLabel: string
  groups: Array<{
    watcherName: string
    items: Array<{ title: string }>
  }>
}

function buildDailyDigestPrompt(input: DailyDigestInput) {
  const lines = input.groups.flatMap((group) => [
    `Watcher: ${group.watcherName}`,
    ...group.items.slice(0, 5).map((item) => `- ${item.title}`),
  ])
  return [
    "You are a concise daily digest assistant.",
    "Summarize today's updates across all watchers in 3-5 sentences.",
    "Do NOT give advice; keep it neutral and factual.",
    `Date: ${input.dateLabel}`,
    "Items:",
    ...lines,
  ].join("\n")
}

export async function generateDailyDigestSummary(input: DailyDigestInput) {
  const fallback = `Daily digest for ${input.dateLabel}. ${
    input.groups.length
  } watcher(s) had updates.`
  try {
    const content = await createAzureChatCompletion(
      [
        { role: "system", content: "You output plain text only." },
        { role: "user", content: buildDailyDigestPrompt(input) },
      ],
      { temperature: 1, responseFormat: "text" },
    )
    return content && content.trim() ? content.trim() : fallback
  } catch {
    return fallback
  }
}

export async function generateWatcherSectionSummary(input: {
  watcherName: string
  items: Array<{ title: string }>
}) {
  const fallback = `${input.watcherName} has ${input.items.length} updates.`
  try {
    const content = await createAzureChatCompletion(
      [
        { role: "system", content: "You output plain text only." },
        {
          role: "user",
          content: [
            "Write one short sentence summarizing updates for this watcher.",
            "Be concise and factual. No advice.",
            `Watcher: ${input.watcherName}`,
            "Items:",
            ...input.items.slice(0, 5).map((item) => `- ${item.title}`),
          ].join("\n"),
        },
      ],
      { temperature: 1, responseFormat: "text" },
    )
    return content && content.trim() ? content.trim() : fallback
  } catch {
    return fallback
  }
}
