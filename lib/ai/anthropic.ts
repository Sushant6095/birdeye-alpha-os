import { anthropic, createAnthropic } from "@ai-sdk/anthropic";

/**
 * Lazily create the Anthropic provider. Default uses the ANTHROPIC_API_KEY
 * env. Tests / local can override the base URL or key via env.
 */
let _provider: ReturnType<typeof createAnthropic> | null = null;

function getProvider() {
  if (_provider) return _provider;
  if (!process.env.ANTHROPIC_API_KEY) {
    return anthropic; // default singleton — will throw on use if unset
  }
  _provider = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.ANTHROPIC_BASE_URL
      ? { baseURL: process.env.ANTHROPIC_BASE_URL }
      : {}),
  });
  return _provider;
}

/** Default model. Override with ANTHROPIC_MODEL_ID env if you need a pin. */
export const DEFAULT_MODEL_ID =
  process.env.ANTHROPIC_MODEL_ID ?? "claude-sonnet-4-6";

export function chatModel() {
  const provider = getProvider();
  return provider(DEFAULT_MODEL_ID);
}
