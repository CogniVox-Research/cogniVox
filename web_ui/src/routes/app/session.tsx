import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SessionProvider } from "@/hooks/use-session";

export const Route = createFileRoute("/app/session")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  );
}
