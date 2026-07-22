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
    
    const tMin = ts[0] ?? 0; 
    const tMax = ts[ts.length - 1] ?? 0;

    return {
        limitBack: getPt(tMin),
        limitForward: getPt(tMax)
    };
}

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { userResponse, correctResponse } = feedbackState;
        const { data } = context; 
        const config = context.config;

        if (Array.isArray(userResponse) && userResponse.length === 2) {
            const [u1, u2] = userResponse;
            drawLine(ctx, context, u1[0], u1[1], u2[0], u2[1], STYLE.incorrectLine);
            drawPoint(ctx, context, u1[0], u1[1], STYLE.incorrectPoint.color);
            drawPoint(ctx, context, u2[0], u2[1], STYLE.incorrectPoint.color);
        }

        let basepoint = data.basepoint;
        let slope = data.slope;

        if (!basepoint && Array.isArray(correctResponse) && correctResponse.length > 0) {
            basepoint = correctResponse[0];
        }
        if (!slope && Array.isArray(correctResponse) && correctResponse.length === 2) {
            const [p1, p2] = correctResponse;
            slope = [p2[1] - p1[1], p2[0] - p1[0]];
        }

        if (!basepoint || !slope) return;

        const p1 = basepoint;
        const p2 = [basepoint[0] + slope[1], basepoint[1] + slope[0]];
        
        const corner = [p1[0], p2[1]]; 

        const riseProgress = Math.min(animationProgress / 0.3, 1);
        const runProgress = Math.min(Math.max((animationProgress - 0.3) / 0.3, 0), 1);
        const extendProgress = Math.min(Math.max((animationProgress - 0.6) / 0.4, 0), 1);

        drawPoint(ctx, context, p1[0], p1[1], STYLE.correctPoint.color);

        if (riseProgress > 0) {
            animateLine(ctx, context, p1[0], p1[1], corner[0], corner[1], riseProgress, {
                color: STYLE.axis.color,
                width: 2,
                dashed: [4, 4]
            });
        }

        if (runProgress > 0) {
            animateLine(ctx, context, corner[0], corner[1], p2[0], p2[1], runProgress, {
                color: STYLE.axis.color,
                width: 2,
                dashed: [4, 4]
            });
        }

        if (runProgress === 1) {
            drawLine(ctx, context, p1[0], p1[1], p2[0], p2[1], STYLE.correctLine);
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
