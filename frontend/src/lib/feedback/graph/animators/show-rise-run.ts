import type { GraphFeedbackAnimator } from '@/types';
import { animateLine, drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
    type: 'graph',
    animate({ ctx, context, feedbackState, animationProgress }) {
        const { data } = context;
        const { userResponse, correctResponse } = feedbackState;
        const basePoint = data.point || data['base-point'];

        drawPoint(ctx, context, userResponse[0], userResponse[1], STYLE.incorrectPoint.color);
        drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.basePoint.color);

        if (basePoint[0] < userResponse[0]) {
            drawLine(ctx, context, basePoint[0], basePoint[1], basePoint[0], userResponse[1], STYLE.incorrectLine);
            drawLine(ctx, context, basePoint[0], userResponse[1], userResponse[0], userResponse[1], STYLE.incorrectLine);
        } else {
            drawLine(ctx, context, basePoint[0], basePoint[1], userResponse[0], basePoint[1], STYLE.incorrectLine);
            drawLine(ctx, context, userResponse[0], basePoint[1], userResponse[0], userResponse[1], STYLE.incorrectLine);
        }

        if (basePoint[0] < correctResponse[0]) {
            const riseProgress = Math.min(animationProgress * 2, 1);
            const runProgress = Math.min(Math.max(animationProgress * 2 - 1, 0), 1);
    
            animateLine(ctx, context, basePoint[0], basePoint[1], basePoint[0], correctResponse[1], riseProgress, STYLE.correctLine);
    
            if (riseProgress > 0) {
                animateLine(ctx, context, basePoint[0], correctResponse[1], correctResponse[0], correctResponse[1], runProgress, STYLE.correctLine);
            }
        } else {
            const runProgress = Math.min(animationProgress * 2, 1);
            const riseProgress = Math.min(Math.max(animationProgress * 2 - 1, 0), 1);
    
            animateLine(ctx, context, basePoint[0], basePoint[1], correctResponse[0], basePoint[1], riseProgress, STYLE.correctLine);
    
            if (runProgress > 0) {
                animateLine(ctx, context, correctResponse[0], basePoint[1], correctResponse[0], correctResponse[1], runProgress, STYLE.correctLine);
            }
    
            drawPoint(ctx, context, basePoint[0], basePoint[1], STYLE.basePoint.color);
        }
        
        if (animationProgress === 1) {
            drawPoint(ctx, context, correctResponse[0], correctResponse[1], STYLE.correctPoint.color);
        }
    }
};

export default animator;
