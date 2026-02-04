import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email/send"
import {
  generateDailyDigestSummary,
  generateNotificationIntro,
  generateSerpApiPlan,
  generateStockBriefing,
  generateWatcherSectionSummary,
} from "@/lib/watchers/ai"
import { providers } from "@/lib/watchers/providers"

const jobSourceIds = new Set([
  "serpapi_google_jobs",
  "remotive",
  "remoteok",
  "arbeitnow",
])
const shoppingSourceIds = new Set(["serpapi_google_shopping"])
const newsSourceIds = new Set(["serpapi_google_news"])
const stockSourceIds = new Set(["finnhub_stocks"])

function mapEngineToProviderId(engine: string) {
  switch (engine) {
    case "google_jobs":
      return "serpapi_google_jobs"
    case "google_shopping":
      return "serpapi_google_shopping"
    case "google_news":
      return "serpapi_google_news"
    default:
      return null
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function isAuthorized(request: Request) {
  const secret = getRequiredEnv("WATCHER_CRON_SECRET")
  const authHeader = request.headers.get("authorization") || ""
  return authHeader === `Bearer ${secret}`
}

function isDebugEnabled(request: Request) {
  return request.headers.get("x-debug") === "1"
}

function shouldForceDigest(request: Request) {
  return request.headers.get("x-force-digest") === "1"
}

function isDue(lastCheckedAt: string | null, intervalMinutes: number) {
  if (!lastCheckedAt) return true
  const last = new Date(lastCheckedAt).getTime()
  const nextDue = last + intervalMinutes * 60 * 1000
  return Date.now() >= nextDue
}

function buildAlertEmail(
  watcherName: string,
  items: Array<{ title: string; url?: string }>,
) {
  const lines = [
    `New matches for watcher "${watcherName}":`,
    "",
    ...items.map((item, index) => {
      const label = `${index + 1}. ${item.title}`
      return item.url ? `${label}\n${item.url}` : label
    }),
  ]
  return lines.join("\n")
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function cleanUrl(raw?: string) {
  if (!raw) return undefined
  try {
    const normalized =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : raw.startsWith("//")
          ? `https:${raw}`
          : `https://${raw}`
    const url = new URL(normalized)
    const paramsToRemove = ["utm_source", "utm_medium", "utm_campaign"]
    paramsToRemove.forEach((param) => url.searchParams.delete(param))
    return url.toString()
  } catch {
    return raw
  }
}

function getDomain(raw?: string) {
  if (!raw) return "Job link"
  try {
    return new URL(raw).hostname.replace(/^www\./, "")
  } catch {
    return raw
  }
}

function getItemLabel(category: string) {
  switch (category) {
    case "shopping":
    case "real_estate":
      return "Listing"
    case "stocks":
      return "Stock"
    case "news":
      return "Article"
    case "jobs":
    default:
      return "Job"
  }
}

function buildHtmlDigest({
  watcherName,
  intro,
  briefing,
  items,
  category,
}: {
  watcherName: string
  intro: string
  briefing?: string
  items: Array<{ title: string; url?: string; description?: string }>
  category: string
}) {
  const headerTitle =
    category === "stocks" ? "📈 Market Briefing" : "Watcher update"
  const header = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
      <div style="border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:16px;">
        <div style="font-size:20px;font-weight:700;color:#111;">${escapeHtml(
          headerTitle,
        )}</div>
        <div style="font-size:14px;color:#666;">${escapeHtml(
          watcherName,
        )}</div>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.5;">${escapeHtml(
        intro,
      )}</p>
      ${
        briefing
          ? `<div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#111;line-height:1.5;">
               ${escapeHtml(briefing).replace(/\n/g, "<br/>")}
             </div>`
          : ""
      }
  `
  const itemLabel = getItemLabel(category)
  const itemIcon =
    category === "stocks"
      ? "💹"
      : category === "shopping" || category === "real_estate"
        ? "🛒"
        : category === "news"
          ? "📰"
          : "🧭"
  const cards = items
    .map((item, index) => {
      const url = cleanUrl(item.url)
      const domain = getDomain(url)
      const titleContent = url
        ? `<a href="${escapeHtml(
            url,
          )}" style="color:#111;text-decoration:none;">${escapeHtml(
            item.title,
          )}</a>`
        : `${escapeHtml(item.title)}`
      const buttonLabel =
        itemLabel === "Job"
          ? "View job"
          : itemLabel === "Article"
            ? "Read article"
            : itemLabel === "Stock"
              ? "View stock"
              : "View listing"
      const descriptionNote = item.description
        ? `<div style="margin-top:6px;font-size:13px;color:#555;line-height:1.4;">${escapeHtml(
            item.description,
          ).replace(/\n/g, "<br/>")}</div>`
        : ""
      return `
        <div style="border:1px solid #eee;border-radius:10px;padding:14px 16px;margin:12px 0;">
          <div style="font-size:14px;color:#999;">#${index + 1} · ${itemIcon} ${escapeHtml(
            itemLabel,
          )}${url ? ` · ${escapeHtml(domain)}` : ""}</div>
          <div style="font-size:16px;font-weight:600;color:#111;margin:6px 0 10px;">
            ${titleContent}
          </div>
          ${descriptionNote}
          ${
            url
              ? `<a href="${escapeHtml(
                  url,
                )}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">${buttonLabel}</a>`
              : ""
          }
        </div>
      `
    })
    .join("")
  const footer = `
      <div style="border-top:1px solid #eee;margin-top:16px;padding-top:12px;font-size:12px;color:#999;">
        ${
          category === "stocks"
            ? "Information is for awareness only and not investment advice."
            : "You can adjust your watcher in the dashboard anytime."
        }
      </div>
    </div>
  `
  return `${header}${cards}${footer}`
}

function buildDailyDigestHtml({
  dateLabel,
  summary,
  groups,
}: {
  dateLabel: string
  summary: string
  groups: Array<{
    watcherName: string
    watcherSummary?: string
    items: Array<{ title: string; url?: string }>
  }>
}) {
  const header = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
      <div style="border-bottom:1px solid #eee;padding-bottom:16px;margin-bottom:16px;">
        <div style="font-size:20px;font-weight:700;color:#111;">🗓️ Daily Digest</div>
        <div style="font-size:14px;color:#666;">${escapeHtml(dateLabel)}</div>
      </div>
      <div style="margin:10px 0 2px;font-size:13px;color:#555;">
        Included watchers:
      </div>
      <div style="font-size:13px;color:#333;">
        ${groups.map((group) => `• ${escapeHtml(group.watcherName)}`).join(" ")}
      </div>
  `
  const sections = groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          const url = cleanUrl(item.url)
          return `
            <li style="margin:6px 0;">
              ${
                url
                  ? `<a href="${escapeHtml(
                      url,
                    )}" style="color:#2563eb;text-decoration:none;">${escapeHtml(
                      item.title,
                    )}</a>`
                  : escapeHtml(item.title)
              }
            </li>
          `
        })
        .join("")
      const summaryLine = group.watcherSummary
        ? `<div style="font-size:13px;color:#555;margin-bottom:6px;">${escapeHtml(
            group.watcherSummary,
          )}</div>`
        : ""
      return `
        <div style="margin:18px 0;padding:14px 16px;border:1px solid #eee;border-radius:10px;">
          <div style="font-weight:600;color:#111;margin-bottom:8px;">${escapeHtml(
            group.watcherName,
          )}</div>
          ${summaryLine}
          <ul style="margin:0;padding-left:18px;color:#333;">${items}</ul>
        </div>
      `
    })
    .join("")
  const footer = `
      <div style="border-top:1px solid #eee;margin-top:16px;padding-top:12px;font-size:12px;color:#999;">
        You can adjust your watchers in the dashboard anytime.
      </div>
    </div>
  `
  return `${header}${sections}${footer}`
}

async function runSourcesForWatcher({
  keywords,
  filters,
  category,
}: {
  keywords: string[]
  filters: Record<string, unknown>
  category: string
}) {
  const engine = filters.serpapiEngine as string | undefined
  if (engine && ["jobs", "shopping", "news", "real_estate"].includes(category)) {
    const providerId = mapEngineToProviderId(engine)
    if (providerId) {
      const provider = providers.find((item) => item.id === providerId)
      if (!provider) return []
      return [
        await provider.run({
          keywords,
          filters,
        }),
      ]
    }
  }

  const sourceFilter = filters.sources as string[] | undefined
  const configuredSources =
    sourceFilter && sourceFilter.length > 0
      ? sourceFilter
      : providers.map((provider) => provider.id)

  const availableSources =
    category === "jobs"
      ? configuredSources.filter((source) => jobSourceIds.has(source))
      : category === "shopping" || category === "real_estate"
        ? configuredSources.filter((source) => shoppingSourceIds.has(source))
        : category === "news"
          ? configuredSources.filter((source) => newsSourceIds.has(source))
          : category === "stocks"
            ? configuredSources.filter((source) => stockSourceIds.has(source))
          : configuredSources

  const finalSources =
    availableSources.length > 0
      ? availableSources
      : category === "jobs"
        ? providers
            .map((provider) => provider.id)
            .filter((source) => jobSourceIds.has(source))
        : category === "shopping" || category === "real_estate"
          ? providers
              .map((provider) => provider.id)
              .filter((source) => shoppingSourceIds.has(source))
          : category === "news"
            ? providers
                .map((provider) => provider.id)
                .filter((source) => newsSourceIds.has(source))
            : category === "stocks"
              ? providers
                  .map((provider) => provider.id)
                  .filter((source) => stockSourceIds.has(source))
        : configuredSources

  const results = []
  for (const source of finalSources) {
    const provider = providers.find((item) => item.id === source)
    if (!provider) continue
    const result = await provider.run({ keywords, filters })
    results.push(result)
  }
  return results
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const debug = isDebugEnabled(request)
  const forceDigest = shouldForceDigest(request)
  const now = new Date()
  const laFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
  const parts = laFormatter.formatToParts(now)
  const hourPart = parts.find((part) => part.type === "hour")?.value
  const dateLabel = parts
    .filter((part) => ["month", "day", "year"].includes(part.type))
    .map((part) => part.value)
    .join(" ")
  const isDigestTime = forceDigest || hourPart === "9"
  const supabase = createAdminClient()
  const { data: watchers, error } = await supabase
    .from("watchers")
    .select(
      [
        "id",
        "user_id",
        "name",
        "category",
        "keywords",
        "source_url",
        "filters",
        "notification_email",
        "notification_interval_minutes",
        "last_checked_at",
        "is_active",
      ].join(","),
    )
    .eq("is_active", true)
    .eq("notification_email", true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  let alertsCreated = 0
  let digestsSent = 0
  const userWatcherCount = new Map<string, number>()
  for (const watcher of watchers ?? []) {
    userWatcherCount.set(
      watcher.user_id,
      (userWatcherCount.get(watcher.user_id) ?? 0) + 1,
    )
  }
  const debugReport: Array<{
    watcherId: string
    watcherName: string
    sources: Array<{
      source: string
      ok: boolean
      message: string
      itemCount: number
      sample: Array<{ title: string; url?: string }>
    }>
  }> = []
  for (const watcher of watchers ?? []) {
    const intervalMinutes = watcher.notification_interval_minutes ?? 1440
    if (!isDue(watcher.last_checked_at, intervalMinutes)) {
      continue
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", watcher.user_id)
      .single()

    if (!profile?.email) {
      continue
    }

    const filters = (watcher.filters as Record<string, unknown>) ?? {}
    if (["jobs", "shopping", "news", "real_estate"].includes(watcher.category)) {
      try {
        const plan = await generateSerpApiPlan({
          name: watcher.name,
          category: watcher.category,
          keywords: (watcher.keywords as string[]) ?? [],
          filters,
        })
        filters.serpapiEngine = plan.engine
        filters.serpapiQuery = plan.query
        if (plan.location) {
          filters.serpapiLocation = plan.location
        }
      } catch (error) {
        console.error("Failed to generate SerpApi plan", error)
      }
    }
    const providerResults = await runSourcesForWatcher({
      keywords: (watcher.keywords as string[]) ?? [],
      filters,
      category: watcher.category,
    })

    if (debug) {
      debugReport.push({
        watcherId: watcher.id,
        watcherName: watcher.name,
        sources: providerResults.map((result) => ({
          source: result.source,
          ok: result.ok,
          message: result.message,
          itemCount: result.items.length,
          sample: result.items.slice(0, 3).map((item) => ({
            title: item.title,
            url: item.url,
          })),
        })),
      })
    }

    const items = providerResults
      .flatMap((result) =>
        result.items.map((item) => ({ ...item, source: result.source })),
      )
      .filter((item) => item.title)

    const { data: existingAlerts } = await supabase
      .from("alerts")
      .select("url")
      .eq("watcher_id", watcher.id)

    const existingUrls = new Set(
      (existingAlerts ?? [])
        .map((alert) => alert.url)
        .filter((url): url is string => Boolean(url)),
    )

    const newItems = items.filter(
      (item) => !item.url || !existingUrls.has(item.url),
    )

    if (newItems.length > 0) {
      const { error: insertError } = await supabase.from("alerts").insert(
        newItems.map((item) => ({
          watcher_id: watcher.id,
          user_id: watcher.user_id,
          title: item.title,
          description: item.description ?? null,
          url: item.url ?? null,
          source: item.source,
          matched_keywords: item.matchedKeywords ?? [],
        })),
      )

      if (!insertError) {
        alertsCreated += newItems.length
      }

      const rankedItems = newItems
        .slice()
        .sort((a, b) => {
          const aScore = a.matchedKeywords?.length ?? 0
          const bScore = b.matchedKeywords?.length ?? 0
          if (aScore !== bScore) return bScore - aScore
          return a.title.localeCompare(b.title)
        })
        .slice(0, 20)

      let textBody = buildAlertEmail(watcher.name, rankedItems)
      let intro =
        watcher.category === "stocks"
          ? `Here is your daily market brief.`
          : `Here are the top ${rankedItems.length} matches we found for you.`
      let briefing: string | undefined
      if (watcher.category === "stocks") {
        const itemsForBriefing = rankedItems.map((item) => {
          const symbol = item.title.split(":")[0]?.trim() || "UNKNOWN"
          const lines = (item.description ?? "").split("\n")
          const earningsLine = lines.find((line) =>
            line.toLowerCase().startsWith("earnings date:"),
          )
          const newsIndex = lines.findIndex((line) =>
            line.toLowerCase().startsWith("top news:"),
          )
          const newsHeadlines =
            newsIndex >= 0 ? lines.slice(newsIndex + 1).filter(Boolean) : []
          return {
            symbol,
            priceLine: item.title,
            earningsLine,
            newsHeadlines,
          }
        })
        briefing = await generateStockBriefing({
          watcherName: watcher.name,
          items: itemsForBriefing,
        })
        textBody = `${intro}\n\n${briefing}\n\n${buildAlertEmail(
          watcher.name,
          rankedItems,
        )}`
      } else {
        try {
          intro = await generateNotificationIntro({
            watcherName: watcher.name,
            titles: rankedItems.map((item) => item.title),
          })
        } catch (error) {
          console.error("Failed to generate intro", error)
        }
      }

      const watcherCount = userWatcherCount.get(watcher.user_id) ?? 0
      if (watcherCount <= 1) {
        await sendEmail({
          to: profile.email,
          subject: `Watcher update: ${watcher.name}`,
          text: textBody,
          html: buildHtmlDigest({
            watcherName: watcher.name,
            intro,
            briefing,
            items: rankedItems.map((item) => ({
              title: item.title,
              url: item.url ?? undefined,
              description: item.description ?? undefined,
            })),
            category: watcher.category,
          }),
        })
      }
    }

    await supabase
      .from("watchers")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", watcher.id)

    processed += 1
  }

  if (isDigestTime) {
    const userIds = Array.from(
      new Set((watchers ?? []).map((watcher) => watcher.user_id)),
    )
    for (const userId of userIds) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email,last_digest_sent_at")
        .eq("id", userId)
        .single()

      if (!profile?.email) continue

      const since = forceDigest
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        : profile.last_digest_sent_at ??
          new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

      const { data: alerts } = await supabase
        .from("alerts")
        .select("watcher_id,title,url,created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })

      if (!alerts || alerts.length === 0) {
        continue
      }

      const { data: userWatchers } = await supabase
        .from("watchers")
        .select("id,name")
        .eq("user_id", userId)

      const watcherNameMap = new Map(
        (userWatchers ?? []).map((watcher) => [watcher.id, watcher.name]),
      )

      const grouped = new Map<string, Array<{ title: string; url?: string }>>()
      for (const alert of alerts) {
        const list = grouped.get(alert.watcher_id) ?? []
        if (list.length < 10) {
          list.push({ title: alert.title, url: alert.url ?? undefined })
        }
        grouped.set(alert.watcher_id, list)
      }

      const groups = []
      for (const [watcherId, items] of grouped.entries()) {
        const watcherName = watcherNameMap.get(watcherId) || "Watcher"
        const watcherSummary = await generateWatcherSectionSummary({
          watcherName,
          items,
        })
        groups.push({ watcherName, watcherSummary, items })
      }

      const summary = await generateDailyDigestSummary({
        dateLabel,
        groups,
      })

      await sendEmail({
        to: profile.email,
        subject: `Daily Digest · ${dateLabel}`,
        text: summary,
        html: buildDailyDigestHtml({
          dateLabel,
          summary,
          groups,
        }),
      })

      await supabase
        .from("profiles")
        .update({ last_digest_sent_at: now.toISOString() })
        .eq("id", userId)

      digestsSent += 1
    }
  }

  return NextResponse.json({
    processed,
    alertsCreated,
    digestsSent,
    ...(debug ? { debugReport } : {}),
  })
}
