export type AzureChatRole = "system" | "user" | "assistant"

export interface AzureChatMessage {
  role: AzureChatRole
  content: string
}

export interface AzureChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  responseFormat?: "json_object" | "text"
}

interface AzureOpenAiConfig {
  endpoint: string
  apiKey: string
  deployment: string
  apiVersion: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function loadAzureConfig(): AzureOpenAiConfig {
  return {
    endpoint: getRequiredEnv("AZURE_OPENAI_ENDPOINT"),
    apiKey: getRequiredEnv("AZURE_OPENAI_API_KEY"),
    deployment: getRequiredEnv("AZURE_OPENAI_DEPLOYMENT"),
    apiVersion: getRequiredEnv("AZURE_OPENAI_API_VERSION"),
  }
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "")
}

export async function createAzureChatCompletion(
  messages: AzureChatMessage[],
  options: AzureChatCompletionOptions = {},
) {
  const { endpoint, apiKey, deployment, apiVersion } = loadAzureConfig()
  const url = `${normalizeEndpoint(
    endpoint,
  )}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

  const payload: Record<string, unknown> = {
    messages,
  }

  if (options.temperature !== undefined) {
    payload.temperature = options.temperature
  } else {
    payload.temperature = 1
  }

  if (options.maxTokens !== undefined) {
    payload.max_completion_tokens = options.maxTokens
  } else {
    payload.max_completion_tokens = 800
  }

  if (options.responseFormat === "json_object") {
    payload.response_format = { type: options.responseFormat }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Azure OpenAI request failed (${response.status}): ${errorText}`,
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error("Azure OpenAI response missing content")
  }

  return content
}
