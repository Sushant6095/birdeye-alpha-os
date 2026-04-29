import { Calendar, Hash, User } from "lucide-react";
import { fmtTimeAgo, shortAddr } from "@/lib/format";
import type { CreationInfo } from "./types";

export function DeployerStrip({
  creation,
  chain,
}: {
  creation: CreationInfo | null;
  chain: string;
}) {
  if (!creation || !creation.tokenAddress) {
    return (
      <div className="rounded-md border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
        Creation info unavailable on {chain}.
      </div>
    );
  }
  return (
    <div className="rounded-md border bg-secondary/20 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <User className="h-3 w-3" />
        deployer{" "}
        <span className="font-mono text-foreground" title={creation.owner}>
          {shortAddr(creation.owner, 4, 4)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Calendar className="h-3 w-3" />
        deployed{" "}
        <span className="text-foreground">
          {fmtTimeAgo(creation.blockUnixTime)}
        </span>{" "}
        ago
      </span>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Hash className="h-3 w-3" />
        tx{" "}
        <span className="font-mono text-foreground" title={creation.txHash}>
          {shortAddr(creation.txHash, 4, 4)}
        </span>
      </span>
    </div>
  );
}
