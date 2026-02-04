# Social Media Monitoring Guide

## Reddit Provider

### Overview
The Reddit provider monitors posts from specified subreddits using Reddit's public JSON API. No API key required.

### Configuration

**Basic Filter Options**:
- `subreddits` (string[]): List of subreddits to search (default: `["all"]`)
- `timeFilter` (string): Time range - "hour", "day", "week", "month", "year", "all" (default: "day")
- `sort` (string): Sort by - "relevance", "hot", "new", "top", "comments" (default: "new")
- `minScore` (number): Minimum post score/upvotes (default: 0)

### Use Cases

#### 1. Track Technology Mentions
**Goal**: Monitor discussions about your tech stack

**Configuration**:
```json
{
  "name": "Tech Stack Mentions",
  "category": "social_media",
  "keywords": ["TypeScript", "React", "Next.js"],
  "filters": {
    "sources": ["reddit"],
    "subreddits": ["programming", "webdev", "reactjs", "typescript"],
    "timeFilter": "day",
    "sort": "new",
    "minScore": 5
  }
}
```

#### 2. Competitor Monitoring
**Goal**: Track competitor mentions and sentiment

**Configuration**:
```json
{
  "name": "Competitor Watch",
  "category": "social_media",
  "keywords": ["Vercel", "Netlify", "Railway"],
  "filters": {
    "sources": ["reddit"],
    "subreddits": ["webdev", "startups", "SaaS"],
    "timeFilter": "week",
    "sort": "top",
    "minScore": 20
  }
}
```

#### 3. Industry News
**Goal**: Stay updated on AI/ML breakthroughs

**Configuration**:
```json
{
  "name": "AI News",
  "category": "social_media",
  "keywords": ["GPT", "Claude", "LLM", "artificial intelligence"],
  "filters": {
    "sources": ["reddit"],
    "subreddits": ["MachineLearning", "artificial", "LocalLLaMA"],
    "timeFilter": "day",
    "sort": "hot",
    "minScore": 50
  }
}
```

#### 4. Product Feedback
**Goal**: Monitor user feedback and feature requests

**Configuration**:
```json
{
  "name": "User Feedback",
  "category": "social_media",
  "keywords": ["feature request", "bug", "feedback"],
  "filters": {
    "sources": ["reddit"],
    "subreddits": ["YourProductSubreddit"],
    "timeFilter": "hour",
    "sort": "new",
    "minScore": 0
  }
}
```

#### 5. Content Ideas
**Goal**: Find trending topics for blog posts

**Configuration**:
```json
{
  "name": "Content Inspiration",
  "category": "social_media",
  "keywords": ["tutorial", "guide", "how to"],
  "filters": {
    "sources": ["reddit"],
    "subreddits": ["learnprogramming", "webdev", "coding"],
    "timeFilter": "week",
    "sort": "top",
    "minScore": 100
  }
}
```

---

### AI-Powered Watcher Creation

Use the "Use description instead" feature to let AI configure your Reddit watcher:

**Example Prompts**:

1. "Monitor r/programming for posts about TypeScript and React with at least 10 upvotes from the last day"

2. "Track mentions of Stripe and PayPal in r/webdev and r/startups, focusing on top posts from the last week"

3. "Find trending AI discussions in r/MachineLearning with 50+ upvotes, posted today"

AI will automatically parse and configure:
- Subreddits
- Time filters
- Sort order
- Score thresholds
- Keywords

---

### Best Practices

#### Rate Limits
- Reddit's public JSON API: ~60 requests/minute per IP
- **Recommendation**: Check watchers every 15-60 minutes
- Watcher will retry on next run if rate limited

#### Subreddit Selection
- Private subreddits: Not accessible
- Quarantined subreddits: Require authentication
- **Use public subreddits only**

#### Content Filtering
- Reddit API returns max 25 posts per request
- Use `minScore` to filter noise
- Combine with keyword matching for precision

#### Performance Tips
1. **Limit subreddits**: 3-5 per watcher
2. **Use specific keywords**: Avoid generic terms
3. **Set reasonable minScore**: Filter out low-quality posts
4. **Choose appropriate timeFilter**:
   - "hour" for real-time monitoring
   - "day" for daily digests
   - "week" for weekly summaries

---

### Finding Good Subreddits
1. Use [Reddit List](https://redditlist.com/) to discover by category
2. Search: https://www.reddit.com/subreddits/search?q=your_topic
3. Check "Related Communities" sidebar

---

### Troubleshooting

#### No results returned
**Causes**:
- Keywords too specific
- `minScore` too high
- Subreddit inactive or misspelled
- Rate limit exceeded

**Solutions**:
- Broaden keywords
- Lower `minScore` to 0
- Verify subreddit: https://www.reddit.com/r/{subreddit}
- Increase watcher interval

#### Too many irrelevant results
**Causes**:
- Keywords too generic
- No `minScore` filter
- Wrong sort order

**Solutions**:
- Use more specific keywords
- Set `minScore: 10` or higher
- Change sort to "top" or "hot"
- Reduce subreddit list

#### Duplicate alerts
**Causes**:
- Watcher running too frequently
- Same post in multiple subreddits

**Solutions**:
- Alert deduplication is automatic (by URL)
- Increase notification interval
- Reduce subreddit overlap

---

## Future Social Media Providers

### Twitter/X (Planned)
- **Requirements**: X API Essential (free tier)
- **Features**: Filtered Stream, Search Posts, hashtag tracking
- **Use Cases**: Brand monitoring, influencer tracking, trending topics
- **Status**: Placeholder created

### Facebook (Planned)
- **Requirements**: Facebook Graph API
- **Features**: Page posts, public groups, event tracking
- **Use Cases**: Community engagement, event discovery
- **Status**: Placeholder created

### Instagram (Planned)
- **Requirements**: Instagram Basic Display API
- **Features**: Hashtag monitoring, user tracking
- **Use Cases**: Brand mentions, visual trends
- **Status**: Placeholder created

### LinkedIn (Planned)
- **Requirements**: LinkedIn API (approved app)
- **Features**: Company updates, network activity
- **Use Cases**: Professional networking, company news
- **Status**: Placeholder created

---

## Testing

### Manual Test
```bash
# 1. Create watcher via UI
# Category: social_media
# Keywords: ["typescript", "nextjs"]
# Filters: { 
#   "sources": ["reddit"], 
#   "subreddits": ["webdev"], 
#   "timeFilter": "day", 
#   "sort": "new", 
#   "minScore": 5 
# }

# 2. Trigger watcher
curl -X POST http://localhost:3000/api/watchers/run \
  -H "x-cron-secret: YOUR_SECRET" \
  -H "x-debug: true"

# 3. Expected: Email with Reddit posts, 5+ upvotes, last 24 hours
```

---

## Support

For issues or feature requests:
1. Check this guide
2. Review dev server logs
3. Enable debug mode: `-H "x-debug: true"`
4. Report with provider name and error message

---

**Last Updated**: 2026-02-04  
**Provider**: Reddit  
**Status**: Production Ready
