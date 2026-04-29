import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ChatFab } from "@/components/shell/chat-fab";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChainProvider } from "@/components/providers/chain-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { AlertEngine } from "@/components/alerts/alert-engine";
import { ToastHost } from "@/components/alerts/toast-host";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <UserProvider>
        <ChainProvider>
          <ToastHost>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <Topbar />
                <main className="flex-1">{children}</main>
              </div>
              <ChatFab />
              <AlertEngine />
            </div>
          </ToastHost>
        </ChainProvider>
      </UserProvider>
    </QueryProvider>
  );
}
