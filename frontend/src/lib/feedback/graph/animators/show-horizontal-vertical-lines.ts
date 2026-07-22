import type { GraphFeedbackAnimator } from '@/types';
import { animateLineHorizontal, animateLineVertical, drawLineHorizontal, drawLineVertical, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { config, data } = context;
        const { correctResponse, userResponse } = feedbackState;
        const basePoint = data.coordinates || data.point || data['base-point'];

        drawPoint(ctx, context, userResponse[0], userResponse[1], STYLE.incorrectPoint.color);
        drawLineHorizontal(ctx, context, userResponse[1], STYLE.incorrectLine);
        drawLineVertical(ctx, context, userResponse[0], STYLE.incorrectLine);

        animateLineHorizontal(ctx, context, 0, basePoint[1], animationProgress, STYLE.correctLine);
        animateLineVertical(ctx, context, basePoint[0], 0, animationProgress, STYLE.correctLine);
        if (animationProgress === 1) {
             drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.correctPoint.color);
        }
    }
};

export default animator;
