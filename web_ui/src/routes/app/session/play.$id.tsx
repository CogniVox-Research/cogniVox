import ErrorPage from "@/features/session/components/error";
import FinishedPage from "@/features/session/components/finished";
import RunningPage from "@/features/session/components/running";
import WaitingPage from "@/features/session/components/waiting";
import useSessionData from "@/hooks/use-session-data";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/session/play/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const state = useSessionData();

  switch (state.state) {
    case "waiting_join":
      return <WaitingPage state={state} />;
    case "error":
      return <ErrorPage state={state} />;
    case "running":
      return <RunningPage state={state} />;
    case "finished":
      return <FinishedPage state={state} />;
  }
}
