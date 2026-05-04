import type Session from "@/lib/session";
import { createContext, useContext, useState, type ReactNode } from "react";

const sessionContext = createContext<{
  session: Session | null;
  setSession: (s: Session) => void;
}>({
  session: null,
  setSession: () => {
    throw new Error("Not inside SessionProvider");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => {
  return useContext(sessionContext);
};

export const SessionProvider = ({
  children,
}: {
  children: ReactNode | ReactNode[];
}) => {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <sessionContext.Provider value={{ session, setSession }}>
      {children}
    </sessionContext.Provider>
  );
};
