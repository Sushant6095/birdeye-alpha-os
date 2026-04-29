import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ChatFab } from "@/components/shell/chat-fab";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChainProvider } from "@/components/providers/chain-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ChainProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Topbar />
            <main className="flex-1">{children}</main>
          </div>
          <ChatFab />
        </div>
      </ChainProvider>
    </QueryProvider>
  );
}
