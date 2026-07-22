import type { GraphFeedbackAnimator } from '@/types';
import { animateLineVertical, drawLineVertical, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { config, data } = context;
        const {userResponse } = feedbackState;

        const x = Array.isArray(userResponse) ? userResponse [0] : userResponse;
        drawLineVertical(ctx, context, x, STYLE.incorrectLine);

        const basePoint = data.coordinates || data.point || data['base-point'];
        animateLineVertical(ctx, context, basePoint[0], basePoint[1], animationProgress, STYLE.correctLine);
        drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.correctPoint.color);
    }
};

export default animator;
