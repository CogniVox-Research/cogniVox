/** ================= Settings =============== */
export type AudienceDifficulty = "easy" | "medium" | "hard";

export type SceneType =
    | {
        scene: "interview";
    }
    | {
        scene: "board_room";
        size: number;
    }
    | {
        scene: "stage";
        size: number;
    };

export type Settings = SceneType & {
    document_id: string;
    distractions: boolean;
    qa: boolean;
    difficulty: AudienceDifficulty;
};

export type GameSettings = SceneType & {
    distractions: boolean;
    difficulty: AudienceDifficulty;
};

/** ================= ASR =============== */
export type Token = {
    text: string;
    probability: number;
};

export type Timestamp = {
    start: number;
    end: number;
};

export type Segment = {
    text: string;
    tokens: Token[];
    probability: number;
    timestamp: Timestamp;
};

export type Silence = {
    timestamp: Timestamp;
};

export type ResultType = "partial" | "complete";

export type Line =
    | ({
        type: "complete";
    } & Segment)
    | ({
        type: "partial";
    } & Segment)
    | {
        type: "silence";
        timestamp: Timestamp;
    };

export type ASR = {
    type: ResultType;
    session_id: string;
    lines: Line[];
    full_text: string;
    current_silence: Silence | null;
};

