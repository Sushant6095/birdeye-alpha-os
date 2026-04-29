"use client";

import Link from "next/link";
import { Fragment, memo } from "react";
import { parseSegments } from "@/lib/ai/parse-tags";
import {
  ChartTag,
  HoldersTag,
  VerdictBadge,
  WalletCardTag,
} from "./custom-tags";

const MD_LINK_RE = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

/**
 * Lightweight markdown subset:
 *  - paragraphs split on blank lines
 *  - bullet lines (- ...) → <li>
 *  - **bold** → <strong>
 *  - inline `code`
 *  - internal links [text](/path) → next/link
 *  - the four AlphaOS custom tags
 *
 * Big enough to make the agent's responses readable; doesn't try to be a
 * full markdown engine.
 */
export const MessageBody = memo(function MessageBody({
  text,
}: {
  text: string;
}) {
  const segments = parseSegments(text);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {segments.map((s, i) => {
        if (s.kind === "verdict") {
          return (
            <VerdictBadge key={i} color={s.color}>
              {s.text}
            </VerdictBadge>
          );
        }
        if (s.kind === "chart") {
          return (
            <ChartTag
              key={i}
              token={s.token}
              chain={s.chain}
              interval={s.interval}
            />
          );
        }
        if (s.kind === "holders") {
          return (
            <HoldersTag
              key={i}
              token={s.token}
              chain={s.chain}
              limit={s.limit}
            />
          );
        }
        if (s.kind === "wallet-card") {
          return (
            <WalletCardTag
              key={i}
              address={s.address}
              chain={s.chain}
            />
          );
        }
        return <TextBlock key={i} text={s.text} />;
      })}
    </div>
  );
});

function TextBlock({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/g);
  return (
    <>
      {blocks.map((b, i) => {
        const trimmed = b.trim();
        if (!trimmed) return null;
        if (trimmed.split("\n").every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-0.5">
              {trimmed.split("\n").map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^-\s*/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <Inline text={trimmed} />
          </p>
        );
      })}
    </>
  );
}

function Inline({ text }: { text: string }) {
  // tokenize: links → bold → code → text
  const linkParts: Array<{ kind: "text" | "link"; text: string; href?: string }> = [];
  let last = 0;
  MD_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK_RE.exec(text))) {
    if (m.index > last)
      linkParts.push({ kind: "text", text: text.slice(last, m.index) });
    linkParts.push({ kind: "link", text: m[1]!, href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length)
    linkParts.push({ kind: "text", text: text.slice(last) });

  return (
    <>
      {linkParts.map((p, i) => {
        if (p.kind === "link") {
          return (
            <Link
              key={i}
              href={p.href!}
              className="text-emerald-300 underline-offset-2 hover:underline"
            >
              {p.text}
            </Link>
          );
        }
        return (
          <Fragment key={i}>{boldAndCode(p.text)}</Fragment>
        );
      })}
    </>
  );
}

function boldAndCode(text: string): React.ReactNode[] {
  // Replace **bold** then `code` then plain.
  const parts: React.ReactNode[] = [];
  const splitBold = text.split(/(\*\*[^*]+\*\*)/g);
  splitBold.forEach((seg, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(seg)) {
      parts.push(
        <strong key={`b${idx}`}>{seg.slice(2, -2)}</strong>,
      );
      return;
    }
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    INLINE_CODE_RE.lastIndex = 0;
    while ((m = INLINE_CODE_RE.exec(seg))) {
      if (m.index > lastIdx) parts.push(seg.slice(lastIdx, m.index));
      parts.push(
        <code
          key={`c${idx}-${m.index}`}
          className="px-1 py-0.5 rounded bg-secondary/60 font-mono text-[12px]"
        >
          {m[1]}
        </code>,
      );
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < seg.length) parts.push(seg.slice(lastIdx));
  });
  return parts;
}
