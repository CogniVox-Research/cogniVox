import { SettingsPage } from "@/features/start-session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/options")({
    component: RouteComponent,
});

function RouteComponent() {
    return <SettingsPage />;
}
