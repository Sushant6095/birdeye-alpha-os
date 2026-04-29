import { generateText, stepCountIs } from "ai";
import { chatModel } from "@/lib/ai/anthropic";
import { allTools } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * One-shot, non-streaming agent call used by Whale Radar to label a fresh
 * whale tx. Capped to a few tool steps to stay cheap.
 */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ verdict: null, error: "ANTHROPIC_API_KEY not set" });
  }
  const body = (await req.json().catch(() => ({}))) as {
    chain?: string;
    address?: string;
    side?: string;
    volumeUsd?: number;
    owner?: string;
  };
  if (!body.address) {
    return Response.json({ verdict: null, error: "address required" });
  }
  const prompt = `A whale just placed a ${body.side ?? "trade"} of ~$${(body.volumeUsd ?? 0).toLocaleString()} on token ${body.address} (chain: ${body.chain ?? "solana"}). Wallet: ${body.owner ?? "unknown"}.

Use tools to look up: token security flags, this wallet's recent buy pattern (if owner provided), and the smart-money picture for this token. Then return ONE sentence describing the verdict in plain English. No tags, no markdown, just one sentence under 180 chars.`;

  try {
    const r = await generateText({
      model: chatModel(),
      prompt,
      tools: allTools,
      stopWhen: stepCountIs(4),
      temperature: 0.2,
      maxOutputTokens: 220,
    });
    return Response.json({ verdict: r.text.trim() });
  } catch (err) {
    return Response.json({ verdict: null, error: (err as Error).message });
  }
}
