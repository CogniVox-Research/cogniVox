import type { WaitingState } from "@/lib/session";

const WaitingPage = ({ state }: { state: WaitingState }) => {
  // Waiting page with qr
  return JSON.stringify(state);
};

export default WaitingPage;
