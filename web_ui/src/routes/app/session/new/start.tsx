import { OptionsPage } from "@/features/start-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/new/start")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptionsPage />;
}
