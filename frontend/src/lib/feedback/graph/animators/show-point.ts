import type { GraphFeedbackAnimator } from '@/types';
import { drawPoint, STYLE } from '@/lib/graphics/drawing';

const animator: GraphFeedbackAnimator = {
   type: 'graph',
   animate({ ctx, context, feedbackState}) {
      const { data } = context;
      const { correctResponse, userResponse } = feedbackState;
      
      drawPoint(ctx, context, userResponse[0], userResponse[1], STYLE.incorrectPoint.color);
      drawPoint(ctx, context, correctResponse[0], correctResponse[1], STYLE.correctPoint.color);
   }
};

export default animator;
