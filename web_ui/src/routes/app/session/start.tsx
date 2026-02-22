import { OptionsPage } from "@/features/start-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/start")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptionsPage />;
}
