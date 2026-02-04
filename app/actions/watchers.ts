"use server"

import { createClient } from "@/lib/supabase/server"
import { parseWatcherSpecFromPrompt } from "@/lib/watchers/ai"
import { revalidateTag } from "next/cache"

export type WatcherCategory =
  | "jobs"
  | "shopping"
  | "real_estate"
  | "stocks"
  | "social_media"
  | "news"

export interface CreateWatcherInput {
  name: string
  category: WatcherCategory
  keywords: string[]
  sourceUrl?: string
  notifyEmail: boolean
  notifySms: boolean
  notificationIntervalMinutes?: number
  filters?: Record<string, unknown>
}

export interface UpdateWatcherInput extends Partial<CreateWatcherInput> {
  id: string
  isActive?: boolean
}

export async function getWatchers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("watchers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getWatcher(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("watchers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function insertWatcher(
  userId: string,
  input: CreateWatcherInput,
  userEmail?: string | null,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watchers")
    .insert({
      user_id: userId,
      name: input.name,
      category: input.category,
      keywords: input.keywords,
      source_url: input.sourceUrl || null,
      notification_email: input.notifyEmail,
      notification_push: input.notifySms,
      notification_interval_minutes: input.notificationIntervalMinutes ?? 1440,
      filters: input.filters ?? {},
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag("watchers", "max")

  if (input.notifyEmail) {
    let recipientEmail = userEmail ?? null
    if (!recipientEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single()
      recipientEmail = profile?.email ?? null
    }

    if (!recipientEmail) {
      console.warn("Watcher email skipped: missing user email", { userId })
      return data
    }

    void (async () => {
      try {
        const { generateWatcherSummary } = await import("@/lib/watchers/ai")
        const { sendEmail } = await import("@/lib/email/send")
        const summary = await generateWatcherSummary({
          name: input.name,
          category: input.category,
          keywords: input.keywords,
          sourceUrl: input.sourceUrl,
          filters: input.filters ?? {},
        })
        await sendEmail({
          to: recipientEmail,
          subject: `Watcher created: ${input.name}`,
          text: summary,
          html: summary
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join(""),
        })
      } catch (emailError) {
        console.error("Failed to send watcher email", emailError)
      }
    })()
  }

  return data
}

export async function createWatcher(input: CreateWatcherInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return insertWatcher(user.id, input, user.email)
}

export async function createWatcherFromPrompt(
  prompt: string,
  options: Pick<
    CreateWatcherInput,
    "notifyEmail" | "notifySms" | "sourceUrl" | "notificationIntervalMinutes"
  >,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const spec = await parseWatcherSpecFromPrompt(prompt)

  return insertWatcher(
    user.id,
    {
    name: spec.name,
    category: spec.category,
    keywords: spec.keywords,
    sourceUrl: options.sourceUrl,
    notifyEmail: options.notifyEmail,
    notifySms: options.notifySms,
      notificationIntervalMinutes: options.notificationIntervalMinutes,
    filters: {
      ...spec.filters,
      sources: spec.sources,
    },
    },
    user.email,
  )
}

export async function updateWatcher(input: UpdateWatcherInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.category !== undefined) updateData.category = input.category
  if (input.keywords !== undefined) updateData.keywords = input.keywords
  if (input.sourceUrl !== undefined) updateData.source_url = input.sourceUrl
  if (input.notifyEmail !== undefined)
    updateData.notification_email = input.notifyEmail
  if (input.notifySms !== undefined)
    updateData.notification_push = input.notifySms
  if (input.notificationIntervalMinutes !== undefined) {
    updateData.notification_interval_minutes = input.notificationIntervalMinutes
  }
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  const { data, error } = await supabase
    .from("watchers")
    .update(updateData)
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag("watchers", "max")

  return data
}

export async function deleteWatcher(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("watchers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag("watchers", "max")

  return { success: true }
}

export async function toggleWatcher(id: string, isActive: boolean) {
  return updateWatcher({ id, isActive })
}
