// src/types/auth.ts

export interface PlayerProfile {
    id: string;
    is_guest: boolean;
    display_name: string;
    rank: number;
    skill_level: number;
}

export interface AuthState {
    authToken: string | null;
    guestToken: string | null;
    player: PlayerProfile | null;
}
