import type { GraphPromptRenderStrategy } from '@/types';
import { drawPoint, STYLE } from '@/lib/graphics/drawing';

const renderer: GraphPromptRenderStrategy = {
    type: 'graph',
    renderStatic(ctx, context) {
        const { data } = context;
        const basePoint = data.point || data['base-point'] || data.coordinates;

        drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.basePoint.color);
    }
};

export default renderer;
