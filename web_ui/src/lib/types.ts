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