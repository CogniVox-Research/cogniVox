import { useSyncExternalStore } from "react";
import { useSession } from "./use-session";

const useSessionData = () => {
  const session = useSession();
  const subscribe = session.session?.subscribe ?? (() => () => {});
  const getState = session.session?.getState ?? (() => null);
  const store = useSyncExternalStore(subscribe, getState);

  return session.session ? store : null;
};

export default useSessionData;
