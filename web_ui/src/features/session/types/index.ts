export type StressDataPoint = {
    timestamp: number;   // unix ms
    level: number;       // 0–100
};

export type TranscriptEntry = {
    id: string;
    timestamp: number;   // unix ms
    text: string;
    isFinal: boolean;    // false = still being recognised
};

export type SessionStatus = 'idle' | 'live' | 'paused' | 'ended';
