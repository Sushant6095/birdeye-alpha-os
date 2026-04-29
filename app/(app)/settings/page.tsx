import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-6 py-10 max-w-2xl space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground">
        AlphaOS keeps state on the device (UUID + preferences) and persists
        watchlists / alert rules to the configured Postgres.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <li>
          <Link
            href="/settings/watchlists"
            className="block rounded-md border bg-secondary/20 hover:bg-secondary/40 p-4"
          >
            <h2 className="font-medium">Watchlists</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Group up to 50 tokens or wallets per list.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/alerts"
            className="block rounded-md border bg-secondary/20 hover:bg-secondary/40 p-4"
          >
            <h2 className="font-medium">Alert rules</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Wallet activity, new listings, whale on watchlist, token-stat
              thresholds.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/alerts/history"
            className="block rounded-md border bg-secondary/20 hover:bg-secondary/40 p-4"
          >
            <h2 className="font-medium">Alert history</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days of fired alerts.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
