import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/features/auth";

export const Route = createFileRoute("/app")({
  component: RouteComponent,
  beforeLoad: () => {
    if (!getStoredToken()) {
      throw redirect({ to: "/auth/login" });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
