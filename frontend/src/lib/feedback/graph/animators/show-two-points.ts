import type { GraphFeedbackAnimator } from '@/types';
import { animateLine, drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

function getBoundaryPoints(p1: number[], p2: number[], config: any) {
    const { minX, maxX, minY, maxY } = config;
    if (!p1 || !p2 || p1[0] === undefined || p2[0] === undefined || p1[1] === undefined || p2[1] === undefined) {
        return { limitBack: undefined, limitForward: undefined };
    }

    const [x1, y1] = p1;
    const [x2, y2] = p2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    
    const getPt = (t: number): [number, number] => [x1 + t * dx, y1 + t * dy];

    const ts: number[] = [];
    if (Math.abs(dx) > 1e-9) {
        ts.push((minX - p1[0]) / dx);
        ts.push((maxX - p1[0]) / dx);
    }
    if (Math.abs(dy) > 1e-9) {
        ts.push((minY - p1[1]) / dy);
        ts.push((maxY - p1[1]) / dy);
    }

    ts.sort((a, b) => a - b);
    
    return {
        limitBack: getPt(ts[0] ?? 0),
        limitForward: getPt(ts[ts.length - 1] ?? 0)
    };
}

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { userResponse, correctResponse } = feedbackState;
        const config = context.config;

        if (Array.isArray(userResponse) && userResponse.length === 2) {
            const [u1, u2] = userResponse;
            drawLine(ctx, context, u1[0], u1[1], u2[0], u2[1], STYLE.incorrectLine);
            drawPoint(ctx, context, u1[0], u1[1], STYLE.incorrectPoint.color);
            drawPoint(ctx, context, u2[0], u2[1], STYLE.incorrectPoint.color);
        }

        if (!Array.isArray(correctResponse) || correctResponse.length !== 2) return;
        const [p1, p2] = correctResponse;

        const segmentProgress = Math.min(animationProgress * 2, 1);
        const extendProgress = Math.max((animationProgress - 0.5) * 2, 0);

        drawPoint(ctx, context, p1[0], p1[1], STYLE.correctPoint.color);

        if (segmentProgress > 0) {
            animateLine(ctx, context, p1[0], p1[1], p2[0], p2[1], segmentProgress, STYLE.correctLine);
        }

        if (segmentProgress === 1) {
            drawPoint(ctx, context, p2[0], p2[1], STYLE.correctPoint.color);
        }

        if (extendProgress > 0) {
            const { limitBack, limitForward } = getBoundaryPoints(p1, p2, config);
            if (limitBack && limitForward && limitBack[0] !== undefined && limitForward[0] !== undefined) {
                animateLine(ctx, context, p2[0], p2[1], limitForward[0], limitForward[1], extendProgress, STYLE.correctLine);
                animateLine(ctx, context, p1[0], p1[1], limitBack[0], limitBack[1], extendProgress, STYLE.correctLine);
            }
        }
    }
};

export default animator;
