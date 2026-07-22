import type { GraphFeedbackAnimator, GraphPromptContext } from '@/types';
import { drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

function clipHalfPlane(ctx: CanvasRenderingContext2D, context: GraphPromptContext, ineq: any) {
    const { minX, maxX, minY, maxY } = context.config;
    const [x1, y1] = ineq.basepoint;
    const [dx, dy] = [ineq.slope[1], ineq.slope[0]]; // target slope is [dy, dx]
    
    let testPt: [number, number] = [x1, y1];
    if (ineq.relation.includes('>')) testPt[1] += 5; else testPt[1] -= 5;

    const nx = -dy;
    const ny = dx;
    const vx = testPt[0] - x1;
    const vy = testPt[1] - y1;
    const orient = (nx * vx + ny * vy) < 0 ? -1 : 1;

    const scale = 100;
    const poly: [number, number][] = [
        [x1 - dx * scale, y1 - dy * scale],
        [x1 + dx * scale, y1 + dy * scale],
        [x1 + dx * scale + nx * orient * scale, y1 + dy * scale + ny * orient * scale],
        [x1 - dx * scale + nx * orient * scale, y1 - dy * scale + ny * orient * scale]
    ];

    const startPoint = poly[0];
    if (!startPoint) return;

    ctx.beginPath();
    ctx.moveTo(context.toCanvasX(startPoint[0]), context.toCanvasY(startPoint[1]));
    poly.slice(1).forEach(pt => ctx.lineTo(context.toCanvasX(pt[0]), context.toCanvasY(pt[1])));
    ctx.closePath();
    ctx.clip();
}

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState }) {
        const { userResponse, correctResponse } = feedbackState;
        const config = context.config;

        if (userResponse?.lines) {
            userResponse.lines.forEach((line: any) => {
                const points = line.points || [];
                if (points.length === 2) {
                    const [p1, p2] = points;
                    const opts = { color: STYLE.incorrectLine.color, width: 2, dashed: line.isDashed ? [5, 5] : undefined };
                    const m = (p2[1] - p1[1]) / (p2[0] - p1[0]);
                    const b = p1[1] - m * p1[0];
                    drawLine(ctx, context, config.minX, m * config.minX + b, config.maxX, m * config.maxX + b, opts);
                }
                points.forEach((p: any) => drawPoint(ctx, context, p[0], p[1], STYLE.incorrectPoint.color, 6));
            });
        }

        if (correctResponse?.inequalities) {
            ctx.save();
            correctResponse.inequalities.forEach((ineq: any) => clipHalfPlane(ctx, context, ineq));
            ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            correctResponse.inequalities.forEach((ineq: any) => {
                const [x1, y1] = ineq.basepoint;
                const [dx, dy] = [ineq.slope[1], ineq.slope[0]];
                const p2 = [x1 + dx, y1 + dy];
                const isStrict = ineq.relation === '<' || ineq.relation === '>';
                const opts = { color: STYLE.correctLine.color, width: 4, dashed: isStrict ? [10, 10] : undefined };
                
                const m = (p2[1] - y1) / (p2[0] - x1);
                const b = y1 - m * x1;
                drawLine(ctx, context, config.minX, m * config.minX + b, config.maxX, m * config.maxX + b, opts);
                drawPoint(ctx, context, x1, y1, STYLE.correctPoint.color, 8);
            });
        }
    }
};

export default animator;
