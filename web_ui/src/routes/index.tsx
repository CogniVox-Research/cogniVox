import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: () => {
    throw redirect({ to: "/auth/login" });
  },
});

function Index() {
  return <Outlet />;
}