import { createContext, useContext, useState, type ReactNode } from "react";
import type { OptionsConfig } from "../types";

const DEFAULT_CONFIG: OptionsConfig = {
    session_type: "speech",
    environment: "stage",
    difficulty: "medium",
    audienceSize: 1,
    distractionsEnabled: false,
    qaEnabled: true,
};

type SessionSetupState = {
    config: OptionsConfig;
    setConfig: (config: OptionsConfig) => void;
    document: File | null;
    setDocument: (file: File | null) => void;
};

const SessionSetupContext = createContext<SessionSetupState | null>(null);

export function SessionSetupProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<OptionsConfig>(DEFAULT_CONFIG);
    const [document, setDocument] = useState<File | null>(null);

    return (
        <SessionSetupContext.Provider
            value={{
                config,
                setConfig,
                document,
                setDocument,
            }}
        >
            {children}
        </SessionSetupContext.Provider>
    );
}

export function useSessionSetup(): SessionSetupState {
    const ctx = useContext(SessionSetupContext);
    if (!ctx) {
        throw new Error("useSessionSetup must be used within SessionSetupProvider");
    }
    return ctx;
}
