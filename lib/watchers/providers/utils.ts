export interface ProviderItemInput {
  title: string
  description?: string
  url?: string
}

export interface KeywordMatchResult {
  matchedKeywords: string[]
}

export function matchKeywords(
  input: ProviderItemInput,
  keywords: string[],
): KeywordMatchResult {
  if (!keywords.length) {
    return { matchedKeywords: [] }
  }

  const haystack = `${input.title}\n${input.description ?? ""}`.toLowerCase()
  const matchedKeywords = keywords.filter((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  )

  return { matchedKeywords }
}

export function shouldSkipKeywordFilter(
  filters: Record<string, unknown> | undefined,
  keywords: string[],
) {
  if (!keywords.length) return true
  return filters?.ignoreKeywordFilter === true
}

export function applyLocationFilter(
  input: ProviderItemInput,
  filters?: Record<string, unknown>,
) {
  const location = (filters?.location as string | undefined)?.trim()
  if (!location) return true
  const haystack = `${input.title}\n${input.description ?? ""}`.toLowerCase()
  return haystack.includes(location.toLowerCase())
}

export async function fetchJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}
