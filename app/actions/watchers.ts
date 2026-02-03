"use server"

import { createClient } from "@/lib/supabase/server"
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

export async function createWatcher(input: CreateWatcherInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("watchers")
    .insert({
      user_id: user.id,
      name: input.name,
      category: input.category,
      keywords: input.keywords,
      source_url: input.sourceUrl || null,
      notify_email: input.notifyEmail,
      notify_sms: input.notifySms,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag("watchers", "max")

  return data
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
  if (input.notifyEmail !== undefined) updateData.notify_email = input.notifyEmail
  if (input.notifySms !== undefined) updateData.notify_sms = input.notifySms
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
