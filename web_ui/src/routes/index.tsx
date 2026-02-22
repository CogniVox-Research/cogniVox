import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});

function Index() {
  return <Outlet />;
}
