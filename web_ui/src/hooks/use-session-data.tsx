import { useSyncExternalStore } from "react";
import { useSession } from "./use-session";

const useSessionData = () => {
  const session = useSession();
  if (session.session == null) throw Error("Session is not set");

  return useSyncExternalStore(
    session.session.subscribe,
    session.session.getState,
  );
};

export default useSessionData;
