import type { GraphInteractionStrategy } from '@/types';
import { drawLineHorizontal, drawLineVertical, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { config, data } = context;
        drawLineHorizontal(ctx, context, hoverPoint.y, STYLE.hoverLine);
        drawLineVertical(ctx, context, hoverPoint.x, STYLE.hoverLine);
    }
};

export default strategy;
