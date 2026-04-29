import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { chatModel } from "@/lib/ai/anthropic";
import { allTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RequestBody {
  messages: UIMessage[];
  chain?: string;
  recentToken?: string;
  recentWallet?: string;
}

const MAX_TOOL_STEPS = 12;
const MAX_OUTPUT_TOKENS = 4000;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const system = buildSystemPrompt({
    chain: body.chain,
    recentToken: body.recentToken,
    recentWallet: body.recentWallet,
  });

  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: chatModel(),
    system,
    messages: modelMessages,
    tools: allTools,
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
    temperature: 0.3,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  return result.toUIMessageStreamResponse();
}
