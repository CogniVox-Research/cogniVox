import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SessionSetupProvider } from "@/features/start-session";

export const Route = createFileRoute("/app/session")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SessionSetupProvider>
      <Outlet />
    </SessionSetupProvider>
  );
}
