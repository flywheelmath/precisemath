import type { GraphInteractionStrategy } from '@/types';
import { drawPoint, STYLE } from '@/lib/graphics/drawing';

const strategy: GraphInteractionStrategy = {
    type: 'graph',
    renderOverlay(ctx, hoverPoint, context) {
        const { userPoints } = context.data;
        const config = context.config;

        if (!Array.isArray(userPoints) || userPoints.length < 2) {
            drawPoint(ctx, context, hoverPoint.x, hoverPoint.y, STYLE.hoverPoint.color);
            return;
        }

        const [p1, p2] = userPoints;
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        
        const isVertical = Math.abs(dx) < 1e-9;
        let shadeAbove = false;

        if (isVertical) {
            shadeAbove = hoverPoint.x >= p1[0];
        } else {
            const m = dy / dx;
            const b = p1[1] - (m * p1[0]);
            const lineY = (m * hoverPoint.x) + b;
            shadeAbove = hoverPoint.y >= lineY;
        }
       
        const HUGE = 1000;
        const xMin = config.minX - 10;
        const xMax = config.maxX + 10;
        
        let poly: [number, number][];

        if (isVertical) {
            const x = p1[0];
            if (shadeAbove) {
                poly = [[x, -HUGE], [HUGE, -HUGE], [HUGE, HUGE], [x, HUGE]];
            } else {
                poly = [[x, -HUGE], [-HUGE, -HUGE], [-HUGE, HUGE], [x, HUGE]];
            }
        } else {
            const m = dy/dx;
            const b = p1[1] - m * p1[0];
            
            const yAtMin = m * xMin + b;
            const yAtMax = m * xMax + b;
            
            if (shadeAbove) {
                poly = [
                    [xMin, yAtMin],
                    [xMax, yAtMax],
                    [xMax, HUGE],
                    [xMin, HUGE]
                ];
            } else {
                poly = [
                    [xMin, yAtMin],
                    [xMax, yAtMax],
                    [xMax, -HUGE],
                    [xMin, -HUGE]
                ];
            }
        }

        ctx.save();
        ctx.beginPath();
        
        const margin = 0.5;
        const tl = { x: context.toCanvasX(config.minX - margin), y: context.toCanvasY(config.maxY + margin) };
        const br = { x: context.toCanvasX(config.maxX + margin), y: context.toCanvasY(config.minY - margin) };
        ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.clip();

        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.beginPath();
        if (poly && poly.length > 0 && poly[0]) {
            ctx.moveTo(context.toCanvasX(poly[0][0]), context.toCanvasY(poly[0][1]));
            for (let i = 1; i < poly.length; i++) {
                const pt = poly[i];
                if (pt) {
                    ctx.lineTo(context.toCanvasX(pt[0]), context.toCanvasY(pt[1]));
                }
            }
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        drawPoint(ctx, context, hoverPoint.x, hoverPoint.y, STYLE.hoverPoint.color);
    }
};

export default strategy;
