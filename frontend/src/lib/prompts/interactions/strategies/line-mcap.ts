import type { GraphInteractionStrategy } from '@/types';
import { drawLine, drawPoint } from '@/lib/graphics/drawing';

export const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { toCanvasX, toCanvasY } = context;
        const points = context.data.userPoints || [];

        const haloRadius = Math.abs(toCanvasX(0.7) - toCanvasX(0));
        ctx.beginPath();
        ctx.arc(toCanvasX(hoverPoint.x), toCanvasY(hoverPoint.y), haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
        ctx.fill();

        drawPoint(ctx, context, hoverPoint.x, hoverPoint.y, '#2c3e50', 10);

        if (points.length === 1) {
            drawLine(ctx, context, points[0][0], points[0][1], hoverPoint.x, hoverPoint.y, {
                color: 'rgba(52, 152, 219, 0.5)',
                width: 4,
                dashed: [5, 5]
            });
        }
    }
};

export default strategy;
