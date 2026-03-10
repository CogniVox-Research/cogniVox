import ErrorPage from "@/features/session/components/error";
import FinishedPage from "@/features/session/components/finished";
import QuestionPage from "@/features/session/components/questions";
import RunningPage from "@/features/session/components/running";
import WaitingPage from "@/features/session/components/waiting";
import useSessionData from "@/hooks/use-session-data";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/session/play")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/app/session/play" });
  const state = useSessionData();

  useEffect(() => {
    if (state == null) navigate({ to: "/app/session/new" });
  }, [state, navigate]);

  if (state == null) return null;

  switch (state.state) {
    case "waiting_join":
      return <WaitingPage state={state} />;
    case "error":
      return <ErrorPage state={state} />;
    case "running":
      return <RunningPage state={state} />;
    case "question":
      return <QuestionPage state={state} />;
    case "finished":
      return <FinishedPage state={state} />;
  }
}
