import type { GraphFeedbackAnimator } from '@/types';
import { animateLine, drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { data } = context;
        const { correctResponse, userResponse } = feedbackState;

        drawLine(ctx, context, 0, userResponse[1], userResponse[0], userResponse[1], STYLE.incorrectLine);
        drawLine(ctx, context, userResponse[0], 0, userResponse[0], userResponse[1], STYLE.incorrectLine);
        drawPoint(ctx, context, userResponse[0], userResponse[1], STYLE.incorrectPoint.color);

        animateLine(ctx, context, 0, correctResponse[1], correctResponse[0], correctResponse[1], animationProgress, STYLE.correctLine);
        animateLine(ctx, context, correctResponse[0], 0, correctResponse[0], correctResponse[1], animationProgress, STYLE.correctLine);
        drawPoint(ctx, context, correctResponse[0], correctResponse[1], STYLE.correctPoint.color);
    }
};

export default animator;
