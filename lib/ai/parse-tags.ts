/**
 * Parser for the AlphaOS custom tag format the model emits inside its
 * markdown stream:
 *
 *   <chart token="..." chain="..." interval="1H" />
 *   <holders token="..." chain="..." limit="10" />
 *   <wallet-card address="..." chain="..." />
 *   <verdict color="green|yellow|red">SHORT_TEXT</verdict>
 *
 * We split a string into a list of segments — either text or one of the
 * recognized tags — and the renderer maps each to a React component.
 */

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "chart"; token: string; chain: string; interval?: string }
  | { kind: "holders"; token: string; chain: string; limit?: number }
  | { kind: "wallet-card"; address: string; chain: string }
  | { kind: "verdict"; color: "green" | "yellow" | "red"; text: string };

const TAG_RE =
  /<(chart|holders|wallet-card|verdict)([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

const ATTR_RE = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;

function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(s))) {
    out[m[1]!] = m[2] ?? "";
  }
  return out;
}

export function parseSegments(input: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(input))) {
    if (m.index > last) {
      out.push({ kind: "text", text: input.slice(last, m.index) });
    }
    const tag = m[1] as Segment["kind"];
    const attrs = parseAttrs(m[2] ?? "");
    const inner = m[3] ?? "";
    switch (tag) {
      case "chart":
        if (attrs["token"] && attrs["chain"]) {
          out.push({
            kind: "chart",
            token: attrs["token"],
            chain: attrs["chain"],
            interval: attrs["interval"],
          });
        }
        break;
      case "holders":
        if (attrs["token"] && attrs["chain"]) {
          out.push({
            kind: "holders",
            token: attrs["token"],
            chain: attrs["chain"],
            limit: attrs["limit"] ? Number(attrs["limit"]) : undefined,
          });
        }
        break;
      case "wallet-card":
        if (attrs["address"] && attrs["chain"]) {
          out.push({
            kind: "wallet-card",
            address: attrs["address"],
            chain: attrs["chain"],
          });
        }
        break;
      case "verdict": {
        const color = (
          attrs["color"] === "green" ||
          attrs["color"] === "yellow" ||
          attrs["color"] === "red"
            ? attrs["color"]
            : "yellow"
        ) as "green" | "yellow" | "red";
        out.push({ kind: "verdict", color, text: inner.trim() });
        break;
      }
    }
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    out.push({ kind: "text", text: input.slice(last) });
  }
  return out;
}
