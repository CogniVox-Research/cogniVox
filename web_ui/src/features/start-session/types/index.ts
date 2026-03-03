export type Environment = "stage" | "boardroom" | "interview";
export type Difficulty = "easy" | "medium" | "hard";
export type Type = "interview" | "speech";

export type OptionsConfig = {
  session_type: Type;
  environment: Environment;
  difficulty: Difficulty;
  distractionsEnabled: boolean;
  audienceSize: number;
  qaEnabled: boolean;
};
