import { initQueue, updateQueue } from './queue';
import type { 
    Prompt,
    QueueState,
    Response,
    ScoreResult,
    SessionLog,
    SkillLevelData,
} from '@/types';

export class SessionEngine {
    private _queueState: QueueState;
    private _history: SessionLog;
    private _isSessionActive: boolean = false;
    private _sessionStartTime: number = 0;
    private _promptStartTime: number = 0;
    private _maxDurationMs: number | null = null;
    private _currentPrompt: Prompt | null = null;

    constructor(
        prompts: Prompt[],
        skillLevels: Record<string, SkillLevelData>,
        userRank: number,
        maxDurationSeconds: number | null = null,
    ) {
        if (!prompts.length) throw new Error("SessionEngine: 0 prompts provided");

        this._queueState = initQueue(prompts, userRank);
        this._history = { history: [], score: { correct: 0, incorrect: 0 } };
        this._maxDurationMs = maxDurationSeconds ? maxDurationSeconds * 1000 : null;

        if (this._queueState.queue.length > 0) {
            this._currentPrompt = this._queueState.queue[0] || null;
        }
    }

    public get currentPrompt() { return this._currentPrompt; }
    public get history() { return this._history; }
    public get isActive() { 
        if (!this._isSessionActive) return false;
        if (this._maxDurationMs && this._sessionStartTime > 0) {
            const elapsed = Date.now() - this._sessionStartTime;
            if (elapsed > this._maxDurationMs + 2000) {
                return false;
            }
        }
        return true; 
    }

    public start(): void {
        if (this._isSessionActive) return;
        this._isSessionActive = !!this._currentPrompt;

        const now = Date.now();
        this._sessionStartTime = now;
        this._promptStartTime = now;
    }

    public submitAnswer(result: ScoreResult, userResponse: string): Prompt | null {
        if (!this.isActive || !this._currentPrompt) {
            throw new Error("SessionEngine: Inactive session.");
        }

        const now = Date.now();
        const timeSpentInSession = now - this._sessionStartTime;
        const timeSpentOnPrompt = now - this._promptStartTime;

        if (this._maxDurationMs && timeSpentInSession > (this._maxDurationMs + 2000)) {
            this.end();
            return null;
        }

        const record: Response = {
            prompt_id: this._currentPrompt.id,
            sequence_index: this._history.history.length + 1,
            was_correct: result.isCorrect,
            time_spent_ms: timeSpentOnPrompt,
            user_response: userResponse,
            correct_items: result.correctItems || [],
            incorrect_items: result.incorrectItems || [],
        };

        this._history.history.push(record);
        result.isCorrect ? this._history.score.correct++ : this._history.score.incorrect++;

        const { nextPrompt, newState } = updateQueue(this._queueState, result.isCorrect);

        this._queueState = newState;
        this._currentPrompt = nextPrompt;

        if (!nextPrompt) {
            this.end();
        } else {
            this._promptStartTime = Date.now();
        }

        return nextPrompt;
    }

    public end(): void {
        this._isSessionActive = false;
        this._currentPrompt = null;
    }
}
