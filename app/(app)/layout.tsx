import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ChatFab } from "@/components/shell/chat-fab";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChainProvider } from "@/components/providers/chain-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { AlertEngine } from "@/components/alerts/alert-engine";
import { ToastHost } from "@/components/alerts/toast-host";
import { RateLimitWatcher } from "@/components/alerts/rate-limit-watcher";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <ChainProvider>
          <ChatProvider>
            <ToastHost>
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <Topbar />
                  <main className="flex-1">{children}</main>
                </div>
                <ChatFab />
                <ChatPanel />
                <AlertEngine />
                <RateLimitWatcher />
              </div>
            </ToastHost>
          </ChatProvider>
        </ChainProvider>
      </UserProvider>
    </QueryProvider>
  );
}
