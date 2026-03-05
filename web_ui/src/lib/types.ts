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

/** ================= Stress Request ================ */

export type StressRequest = {
    eda_mean?: number | null;
    eda_std?: number | null;
    eda_min?: number | null;
    eda_max?: number | null;
    bvp_mean: number;
    bvp_std: number;
    temp_mean?: number | null;
    temp_std?: number | null;
    acc_mag_mean?: number | null;
    acc_mag_std?: number | null;

    // Lite specific
    bvp_min?: number | null;
    bvp_max?: number | null;
    bvp_range?: number | null;
    bvp_energy?: number | null;
    acc_mean?: number | null;
    acc_std?: number | null;
    acc_max?: number | null;

    session_id?: string | null;
};


