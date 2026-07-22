export type PlayerResponse = string | number | string[];

export interface CorrectResponse {
    validator: string;
    value: any;
}

export interface Prompt {
    id: string;
    data: Record<string, any>;
    prompt_text: string;
    correct_response: CorrectResponse;
    skill_level_rank?: number;
}

export interface SkillLevelData {
    id: string;
    skill_level_rank: number;
    slug: string;
    name: string;
    interaction_config?: string;
}

export interface Response {
    prompt_id: string;
    sequence_index: number;
    was_correct: boolean;
    time_spent_ms: number;
    player_response: string;
    correct_items?: string[];
    incorrect_items?: string[];
}

export interface Player {
    id: string;
    is_guest: boolean;
    display_name: string;
    pin: string;
}

export interface PlayerSkillProfile {
    player_id: string;
    skill_slug: string;
    player_skill_level: number;
}

export interface SessionLog {
    history: Response[];
    score: {
        correct: number;
        incorrect: number;
    };
}

export interface SessionPayload {
    session_id?: string;
    category_slug: string;
    skill_slug: string;
    start_time: string;
    end_time: string;
    total_correct: number;
    total_incorrect: number;
    responses: Response[];
    guest_username?: string;
    is_final?: boolean;
}

export interface PromptPerformance {
    prompt_id: string;
    display_text: string;
    success_rate: number;
    correct: number;
    incorrect: number;
    total_responses: number;
}

export interface SessionReport {
    total_correct: number;
    total_incorrect: number;
    correct_per_minute: number;
    most_accurate_prompts: PromptPerformance[];
    least_accurate_prompts: PromptPerformance[];
}

export interface Point {
    x: number;
    y: number;
    id: string;
    label?: string;
}
