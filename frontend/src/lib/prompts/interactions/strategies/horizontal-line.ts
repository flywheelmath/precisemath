import type { GraphInteractionStrategy } from '@/types';
import { drawLineHorizontal, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { config, data } = context;
        drawLineHorizontal(ctx, context, hoverPoint.y, STYLE.hoverLine);
    }
};

export default strategy;
