import type { Provider, ProviderRunResult } from "@/lib/watchers/providers"
import { fetchJson, matchKeywords, shouldSkipKeywordFilter } from "../utils"

interface RedditPost {
  data: {
    title: string
    selftext?: string
    subreddit?: string
    permalink?: string
    url?: string
    author?: string
    created_utc?: number
    score?: number
    num_comments?: number
  }
}

interface RedditSearchResponse {
  data?: {
    children?: RedditPost[]
  }
}

/**
 * Reddit API provider for social media monitoring
 * Uses Reddit's public JSON API (no authentication required for basic search)
 * 
 * Filters:
 * - subreddits (string[]): List of subreddits to search (default: ["all"])
 * - timeFilter (string): Time range - "hour", "day", "week", "month", "year", "all" (default: "day")
 * - sort (string): Sort by - "relevance", "hot", "new", "top", "comments" (default: "new")
 * - minScore (number): Minimum post score/upvotes (default: 0)
 */
export function createRedditProvider(): Provider {
  return {
    id: "reddit",
    label: "Reddit",
    requiresApi: false, // Reddit JSON API is public
    async run({ keywords, filters }) {
      try {
        const subreddits = (filters?.subreddits as string[]) ?? ["all"]
        const timeFilter = (filters?.timeFilter as string) ?? "day"
        const sort = (filters?.sort as string) ?? "new"
        const minScore = (filters?.minScore as number) ?? 0

        const allItems: Array<{
          title: string
          description?: string
          url?: string
          matchedKeywords?: string[]
        }> = []

        // Search each subreddit
        for (const subreddit of subreddits) {
          const query = keywords.length > 0 ? keywords.join(" OR ") : ""
          
          // Build Reddit search URL
          // Example: https://www.reddit.com/r/programming/search.json?q=typescript&t=day&sort=new&limit=25
          const searchUrl = query
            ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&t=${timeFilter}&sort=${sort}&limit=25&raw_json=1`
            : `https://www.reddit.com/r/${subreddit}/${sort}.json?t=${timeFilter}&limit=25&raw_json=1`

          const response = await fetchJson<RedditSearchResponse>(searchUrl, {
            headers: {
              "User-Agent": "Watcher/1.0 (Post monitoring bot)",
            },
          })

          const posts = response.data?.children ?? []
          const skipKeywordFilter = shouldSkipKeywordFilter(filters, keywords)

          const items = posts
            .filter((post) => post.data.score >= minScore)
            .map((post) => {
              const title = post.data.title || "Untitled post"
              const description = post.data.selftext
                ? post.data.selftext.substring(0, 200) + "..."
                : `r/${post.data.subreddit} • ${post.data.score} points • ${post.data.num_comments} comments`
              const url = post.data.permalink
                ? `https://www.reddit.com${post.data.permalink}`
                : post.data.url

              return { title, description, url }
            })
            .map((item) => {
              if (skipKeywordFilter) {
                return { ...item, matchedKeywords: keywords }
              }
              const { matchedKeywords } = matchKeywords(item, keywords)
              return { ...item, matchedKeywords }
            })
            .filter((item) => skipKeywordFilter || item.matchedKeywords?.length)

          allItems.push(...items)
        }

        return {
          source: "reddit",
          ok: true,
          message: `Fetched posts from r/${subreddits.join(", r/")}`,
          items: allItems,
        } satisfies ProviderRunResult
      } catch (error) {
        return {
          source: "reddit",
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Reddit API request failed",
          items: [],
        }
      }
    },
  }
}
