import type { GraphFeedbackAnimator } from '@/types';
import { drawLine, drawPoint, animateLine, STYLE } from '@/lib/graphics/drawing';

const getCoords = (p: any): [number, number] => {
    if (Array.isArray(p)) return [p[0], p[1]];
    if (p && typeof p === 'object') return [p.x, p.y];
    return [0, 0];
};

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { userResponse, correctResponse } = feedbackState;
        const config = context.config;

        const uPoints = userResponse?.points || userResponse;
        if (Array.isArray(uPoints)) {
            uPoints.forEach(p => {
                const [ux, uy] = getCoords(p);
                drawPoint(ctx, context, ux, uy, STYLE.incorrectPoint.color);
            });
        }

        let h: number | undefined;
        let k: number | undefined;
        let a: number | undefined;
        let xp: number | undefined;
        let yp: number | undefined;
        
        if (correctResponse && typeof correctResponse === 'object' && !Array.isArray(correctResponse)) {
            h = correctResponse.h;
            k = correctResponse.k;
            a = correctResponse.a;
            xp = (h ?? 0) + 1;
            yp = (a ?? 0) * Math.pow(xp - (h ?? 0), 2) + (k ?? 0);
        } 
        else if (Array.isArray(correctResponse) && correctResponse.length === 2) {
            [h, k] = getCoords(correctResponse[0]);
            [xp, yp] = getCoords(correctResponse[1]);
            const dx_p = xp - h;
            if (dx_p !== 0) a = (yp - k) / (dx_p * dx_p);
        }

        if (h === undefined || k === undefined || a === undefined || xp === undefined || yp === undefined) return;

        const axesProgress = Math.min(animationProgress / 0.3, 1);
        const riseRunProgress = Math.min(Math.max((animationProgress - 0.3) / 0.3, 0), 1);
        const curveProgress = Math.min(Math.max((animationProgress - 0.6) / 0.4, 0), 1);

        if (axesProgress > 0) {
            animateLine(ctx, context, h, 0, h, k, axesProgress, { color: STYLE.axis.color, width: 2, dashed: [4, 4] });
            animateLine(ctx, context, 0, k, h, k, axesProgress, { color: STYLE.axis.color, width: 2, dashed: [4, 4] });
        }

        if (axesProgress === 1) drawPoint(ctx, context, h, k, STYLE.correctPoint.color);

        if (riseRunProgress > 0) {
            const pRise = Math.min(riseRunProgress / 0.5, 1);
            const pRun = Math.min(Math.max((riseRunProgress - 0.5) / 0.5, 0), 1);
            animateLine(ctx, context, h, k, h, yp, pRise, { color: STYLE.auxLine.color, width: 2, dashed: [4, 4] });
            if (pRun > 0) animateLine(ctx, context, h, yp, xp, yp, pRun, { color: STYLE.auxLine.color, width: 2, dashed: [4, 4] });
        }

        if (riseRunProgress === 1) drawPoint(ctx, context, xp, yp, STYLE.correctPoint.color);

        if (curveProgress > 0) {
            ctx.save();
            ctx.strokeStyle = STYLE.correctLine.color;
            ctx.lineWidth = STYLE.correctLine.width;
            const maxDist = Math.max(Math.abs(config.maxX - h), Math.abs(config.minX - h));
            const currentDist = maxDist * curveProgress;

            [1, -1].forEach(dir => {
                ctx.beginPath();
                ctx.moveTo(context.toCanvasX(h), context.toCanvasY(k));
                for (let d = 0; d <= currentDist; d += 0.1) {
                    const x = h + (d * dir);
                    const y = a * Math.pow(x - h, 2) + k;
                    ctx.lineTo(context.toCanvasX(x), context.toCanvasY(y));
                }
                ctx.stroke();
            });
            ctx.restore();
        }
    }
};

export default animator;
