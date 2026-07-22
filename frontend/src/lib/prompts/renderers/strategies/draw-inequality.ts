import type { GraphPromptRenderStrategy } from '@/types';
import { drawLine, drawPoint, STYLE } from '@/lib/graphics/drawing';

const renderer: GraphPromptRenderStrategy = {
    type: 'graph',
    renderStatic(ctx, context) {
        const { userPoints, isDashed, shadingPoint } = context.data;
        const config = context.config;

        if (!Array.isArray(userPoints) || userPoints.length < 2) {
            if (userPoints && userPoints.length > 0) {
                 userPoints.forEach((p: any) => drawPoint(ctx, context, p[0], p[1], STYLE.point.color));
            }
            return;
        }

        const [p1, p2] = userPoints;

        if (!p1 || !p2 || p1[0] === undefined || p1[1] === undefined || p2[0] === undefined || p2[1] === undefined) {
            return;
        }

        drawPoint(ctx, context, p1[0], p1[1], STYLE.point.color);
        drawPoint(ctx, context, p2[0], p2[1], STYLE.point.color);

        if (isDashed === null || isDashed === undefined) {
            return;
        }

        if (shadingPoint) {
            ctx.save();
            ctx.beginPath();
            
            const margin = 0.5;
            const xMin = config.minX - margin;
            const xMax = config.maxX + margin;
            const yMin = config.minY - margin;
            const yMax = config.maxY + margin;
            
            const tl = { x: context.toCanvasX(xMin), y: context.toCanvasY(yMax) };
            const br = { x: context.toCanvasX(xMax), y: context.toCanvasY(yMin) };
            
            ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            ctx.clip();

            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            
            let nx = -dy;
            let ny = dx;
            
            const vx = shadingPoint[0] - p1[0];
            const vy = shadingPoint[1] - p1[1];
            
            if ((nx * vx + ny * vy) < 0) {
                nx = -nx;
                ny = -ny;
            }

            const hugeScale = 100;
            const len = Math.sqrt(nx*nx + ny*ny);
            const hugeNx = (nx / len) * hugeScale;
            const hugeNy = (ny / len) * hugeScale;
            const lineScale = 100;

            const [x1, y1] = p1;

            const L1: [number, number] = [x1 - dx*lineScale, y1 - dy*lineScale];
            const L2: [number, number] = [x1 + dx*lineScale, y1 + dy*lineScale];

            const poly: [number, number][] = [
                L1,
                L2,
                [L2[0] + hugeNx, L2[1] + hugeNy],
                [L1[0] + hugeNx, L1[1] + hugeNy],
            ];

    
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.beginPath();

            if (poly.length > 0 && poly[0]) {
                ctx.moveTo(context.toCanvasX(poly[0][0]), context.toCanvasY(poly[0][1]));
                for (let i = 1; i < poly.length; i++) {
                    const pt = poly[i];
                    if (pt && pt[0] !== undefined && pt[1] !== undefined) {
                        ctx.lineTo(context.toCanvasX(pt[0]), context.toCanvasY(pt[1]));
                    }
                }
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }

        const slope = [p2[1]-p1[1], p2[0]-p1[0]];
        const INF = 100;
        if (slope && typeof slope[0] === 'number' && typeof slope[1] === 'number') {
            const x1_inf = p1[0] - slope[1] * INF;
            const y1_inf = p1[1] - slope[0] * INF;
            const x2_inf = p1[0] + slope[1] * INF;
            const y2_inf = p1[1] + slope[0] * INF;
    
            drawLine(ctx, context, x1_inf, y1_inf, x2_inf, y2_inf, {
                color: STYLE.point.color,
                width: STYLE.line.width,
                dashed: isDashed ? [10, 10] : undefined
            });
        }
    }
};

export default renderer;
