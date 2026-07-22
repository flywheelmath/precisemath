import type { GraphInteractionStrategy } from '@/types';
import { drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const anchor = context.data.anchorPoint;
        
        if (anchor) {
            const x1 = anchor[0];
            const y1 = anchor[1];
            const x2 = hoverPoint.x;
            const y2 = hoverPoint.y;

            drawLine(ctx, context, x1, y1, x2, y2, STYLE.hoverLine);
            drawPoint(ctx, context, x1, y1, STYLE.hoverPoint.color);
        }
        
        drawPoint(ctx, context, hoverPoint.x, hoverPoint.y, STYLE.hoverPoint.color);
    }
};

export default strategy;
