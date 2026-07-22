import type { GraphInteractionStrategy } from '@/types';
import { drawPoint, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { data } = context;
        drawPoint(ctx, context, hoverPoint.x, hoverPoint.y, STYLE.hoverPoint.color);
    }
};

export default strategy;
