import type { GraphInteractionStrategy } from '@/types';
import { drawLine, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { data } = context;
        const basePoint = data.point || data['base-point'] || data.coordinates;

        const x1 = basePoint[0];
        const y1 = basePoint[1];
        const x2 = hoverPoint.x;
        const y2 = hoverPoint.y;

        if (x1 < x2) {
            drawLine(ctx, context, x1, y1, x1, y2, STYLE.hoverLine);
            drawLine(ctx, context, x1, y2, x2, y2, STYLE.hoverLine);
        } else {
            drawLine(ctx, context, x1, y1, x2, y1, STYLE.hoverLine);
            drawLine(ctx, context, x2, y1, x2, y2, STYLE.hoverLine);
        }
    }
};

export default strategy;
