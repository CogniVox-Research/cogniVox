export type Environment = "stage" | "board_room" | "interview";
export type Difficulty = "easy" | "medium" | "hard";

export type OptionsConfig = {
  environment: Environment;
  difficulty: Difficulty;
  distractions: boolean;
  audienceSize: number;
  qaEnabled: boolean;
};
