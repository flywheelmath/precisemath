import type { GraphInteractionStrategy } from '@/types';
import { drawLineVertical, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { config, data } = context;
        drawLineVertical(ctx, context, hoverPoint.x, STYLE.hoverLine);
    }
};

export default strategy;
