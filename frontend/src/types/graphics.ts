import type { FeedbackState } from './engine';

export interface PromptContext {
    data: Record<string, any>;
}

export interface GraphPromptContext extends PromptContext {
    config: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    toCanvasX: (x: number) => number;
    toCanvasY: (y: number) => number;
}

export type DrawFunctionParams = {
    ctx: CanvasRenderingContext2D;
    feedbackState: FeedbackState;
    animationProgress: number;
    config: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    toCanvasX: (x: number) => number;
    toCanvasY: (y: number) => number;
    drawPoint: (point: [number, number], color: string, size: number) => void;
}

export interface PromptRenderStrategy {
    type: string;
}

export interface GraphPromptRenderStrategy {
    type: 'graph',
    renderStatic(
        ctx: CanvasRenderingContext2D,
        context: GraphPromptContext,
    ): void;
}

export interface InteractionStrategy {
    type: string;
}

export interface GraphInteractionStrategy extends InteractionStrategy {
    type: 'graph',
    renderOverlay(
        ctx: CanvasRenderingContext2D,
        hoverPoint: { x: number, y: number },
        context: GraphPromptContext,
        ): void;
}

export interface FeedbackAnimator {
    type: string;
}

export interface GraphFeedbackAnimator extends FeedbackAnimator {
    type: 'graph',
    animate(params: {
        ctx: CanvasRenderingContext2D;
        feedbackState: FeedbackState;
        context: GraphPromptContext;
        animationProgress: number;
    }): void;
}


