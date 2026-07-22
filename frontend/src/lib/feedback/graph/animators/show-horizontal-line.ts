import type { GraphFeedbackAnimator } from '@/types';
import { animateLineHorizontal, drawLineHorizontal, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress}) {
        const { config, data } = context;
        const { userResponse } = feedbackState;

        const y = Array.isArray(userResponse) ? userResponse [1] : userResponse;
        drawLineHorizontal(ctx, context, y, STYLE.incorrectLine);

        const basePoint = data.coordinates || data.point || data['base-point'];
        animateLineHorizontal(ctx, context, basePoint[0], basePoint[1], animationProgress, STYLE.correctLine);
        drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.correctPoint.color);
    }
};

export default animator;
