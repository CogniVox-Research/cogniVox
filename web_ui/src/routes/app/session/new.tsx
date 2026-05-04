import { SessionSetupProvider } from "@/features/start-session";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/new")({
  component: RouteComponent,
  beforeLoad: (e) => {
    if (
      e.location.pathname == "/app/session/new" ||
      e.location.pathname == "/app/session/new/"
    ) {
      throw redirect({ to: "/app/session/new/start" });
    }
  },
});

function RouteComponent() {
  return (
    <SessionSetupProvider>
      <Outlet />
    </SessionSetupProvider>
  );
}
