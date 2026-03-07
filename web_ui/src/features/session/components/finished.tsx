import type { FinishedState } from "@/lib/session";

const FinishedPage = ({ state }: { state: FinishedState }) => {
  // Result screen here
  return JSON.stringify(state);
};

export default FinishedPage;
