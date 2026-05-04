import type { ErrorState } from "@/lib/session";

const ErrorPage = ({ state }: { state: ErrorState }) => {
  // Error screen
  return JSON.stringify(state);
};

export default ErrorPage;
