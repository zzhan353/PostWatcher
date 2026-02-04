import { createClient } from "@/lib/supabase/server"
import { providers } from "@/lib/watchers/providers"

export interface WatcherRunnerResult {
  watcherId: string
  ok: boolean
  message: string
  providerResults: Array<{
    source: string
    ok: boolean
    message: string
    itemCount: number
  }>
}

export async function runWatcher(watcherId: string): Promise<WatcherRunnerResult> {
  const supabase = await createClient()

  const { data: watcher, error } = await supabase
    .from("watchers")
    .select("id, user_id, keywords, filters")
    .eq("id", watcherId)
    .single()

  if (error || !watcher) {
    throw new Error(error?.message || "Watcher not found")
  }

  const filters = (watcher.filters as Record<string, unknown> | null) ?? {}
  const sources =
    (filters.sources as string[] | undefined) ??
    providers.map((provider) => provider.id)

  const providerResults = []

  for (const source of sources) {
    const provider = providers.find((item) => item.id === source)
    if (!provider) {
      providerResults.push({
        source,
        ok: false,
        message: "Unknown provider",
        itemCount: 0,
      })
      continue
    }

    const result = await provider.run({
      keywords: (watcher.keywords as string[]) ?? [],
      filters,
    })

    providerResults.push({
      source: result.source,
      ok: result.ok,
      message: result.message,
      itemCount: result.items.length,
    })
  }

  return {
    watcherId,
    ok: providerResults.some((result) => result.ok),
    message:
      "Runner configured. Providers are placeholders until API setup is complete.",
    providerResults,
  }
}
