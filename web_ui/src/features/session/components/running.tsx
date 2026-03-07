import type { RunningState } from "@/lib/session";

const RunningPage = ({ state }: { state: RunningState }) => {
  // Running screen with live updates
  return JSON.stringify(state);
};

export default RunningPage;
