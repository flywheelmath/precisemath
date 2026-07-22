import type { GraphPromptRenderStrategy, GraphPromptContext } from '@/types';
import { drawLine, drawPoint } from '@/lib/graphics/drawing'; 

export const strategy: GraphPromptRenderStrategy = {
    type: 'graph',
    renderStatic(ctx, context) {
        const points = context.data.userPoints;
        if (!Array.isArray(points) || points.length === 0) return;

        points.forEach(p => {
            const cx = context.toCanvasX(p[0]);
            const cy = context.toCanvasY(p[1]);
            
            const haloRadius = Math.abs(context.toCanvasX(0.7) - context.toCanvasX(0));
            ctx.beginPath();
            ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
            ctx.fill();
            
            drawPoint(ctx, context, p[0], p[1], '#3498db', 10);
        });

        if (points.length === 2) {
            const [p1, p2] = points;
            const { minX, maxX, minY, maxY } = context.config;
            
            if (p1[0] === p2[0]) {
                drawLine(ctx, context, p1[0], minY, p1[0], maxY, { color: '#3498db', width: 3 });
            } else {
                const m = (p2[1] - p1[1]) / (p2[0] - p1[0]);
                const b = p1[1] - m * p1[0];
                drawLine(ctx, context, minX, m * minX + b, maxX, m * maxX + b, { color: '#3498db', width: 3 });
            }
        }
    }
};

export default strategy;
