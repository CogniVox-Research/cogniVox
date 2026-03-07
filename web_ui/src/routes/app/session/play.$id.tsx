import useSessionData from "@/hooks/use-session-data";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/play/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const state = useSessionData();

  switch (state.state) {
    case "waiting_join":
      // Waiting page with qr
      return <div>{JSON.stringify(state)}</div>;
    case "error":
      // Error screen
      return <div>{JSON.stringify(state)}</div>;
    case "running":
      // Running screen with live updates
      return <div>{JSON.stringify(state)}</div>;
    case "finished":
      // Result screen here
      return <div>{JSON.stringify(state)}</div>;
  }
}
