export type Environment = 'stage' | 'boardroom' | 'interview';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type OptionsConfig = {
    environment: Environment;
    difficulty: Difficulty;
    distractionsEnabled: boolean;
    qaEnabled: boolean;
};
