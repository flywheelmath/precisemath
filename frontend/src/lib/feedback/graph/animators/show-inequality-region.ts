import type { GraphFeedbackAnimator } from '@/types';
import { drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { correctResponse } = feedbackState;
        const config = context.config;
        
        if (!correctResponse) return;

        const { basepoint, slope, relation } = correctResponse;
        if (!basepoint || !slope || !relation) return;

        const dy = slope[0];
        const dx = slope[1];
        const p1 = basepoint;

        const isStrict = ['<', '>'].includes(relation);
        const lineStyle = {
            ...STYLE.correctLine,
            dashed: isStrict ? [10, 10] : []
        };

        const INF = 100;
        const x1_inf = p1[0] - dx * INF;
        const y1_inf = p1[1] - dy * INF;
        const x2_inf = p1[0] + dx * INF;
        const y2_inf = p1[1] + dy * INF;

        drawLine(ctx, context, x1_inf, y1_inf, x2_inf, y2_inf, lineStyle);

        if (animationProgress > 0) {
            const isAbove = ['>', '>='].includes(relation);
            const isVertical = Math.abs(dx) < 1e-9;
            const HUGE = 100; 
            const xMin = config.minX - 10;
            const xMax = config.maxX + 10;
            
            let poly: [number, number][];
            const currentDist = HUGE * animationProgress;

            if (isVertical) {
                const x = p1[0];
                if (isAbove) {
                    poly = [[x, -HUGE], [x + currentDist, -HUGE], [x + currentDist, HUGE], [x, HUGE]];
                } else {
                    poly = [[x, -HUGE], [x - currentDist, -HUGE], [x - currentDist, HUGE], [x, HUGE]];
                }
            } else {
                const m = dy / dx;
                const b = p1[1] - (m * p1[0]);
                const yAtMin = m * xMin + b;
                const yAtMax = m * xMax + b;
                
                const sign = isAbove ? 1 : -1;
                
                poly = [
                    [xMin, yAtMin],
                    [xMax, yAtMax],
                    [xMax, yAtMax + (currentDist * sign)],
                    [xMin, yAtMin + (currentDist * sign)]
                ];
            }

            ctx.save();
            ctx.beginPath();
            
            const margin = 0.5;
            const tl = { x: context.toCanvasX(config.minX - margin), y: context.toCanvasY(config.maxY + margin) };
            const br = { x: context.toCanvasX(config.maxX + margin), y: context.toCanvasY(config.minY - margin) };
            ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            ctx.clip();

            ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
            ctx.beginPath();
            if (poly[0]) {
                ctx.moveTo(context.toCanvasX(poly[0][0]), context.toCanvasY(poly[0][1]));
                for (let i = 1; i < poly.length; i++) {
                    const pt = poly[i];
                    if (pt) {
                        ctx.lineTo(context.toCanvasX(pt[0]), context.toCanvasY(pt[1]));
                    }
                }
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        drawPoint(ctx, context, p1[0], p1[1], STYLE.correctPoint.color);
        drawPoint(ctx, context, p1[0] + dx, p1[1] + dy, STYLE.correctPoint.color);
    }
};

export default animator;
