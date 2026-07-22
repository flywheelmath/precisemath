import type { GraphPromptRenderStrategy, GraphPromptContext } from '@/types';
import { drawLine, drawPoint } from '@/lib/graphics/drawing';

function clipToHalfPlane(
    ctx: CanvasRenderingContext2D, 
    context: GraphPromptContext, 
    linePoints: [number, number][], 
    seed: [number, number]
) {
    const [p1, p2] = linePoints;
    if (!p1 || !p2) return;

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];

    let nx = -dy;
    let ny = dx;

    const vx = seed[0] - p1[0];
    const vy = seed[1] - p1[1];

    if ((nx * vx + ny * vy) < 0) {
        nx = -nx;
        ny = -ny;
    }

    const hugeScale = 100;
    const len = Math.sqrt(nx*nx + ny*ny);
    const hnx = (nx / len) * hugeScale;
    const hny = (ny / len) * hugeScale;
    const lineScale = 100;

    const poly: [number, number][] = [
        [p1[0] - dx * lineScale, p1[1] - dy * lineScale],
        [p1[0] + dx * lineScale, p1[1] + dy * lineScale],
        [p1[0] + dx * lineScale + hnx, p1[1] + dy * lineScale + hny],
        [p1[0] - dx * lineScale + hnx, p1[1] - dy * lineScale + hny]
    ];

    const firstPt = poly[0];
    if (!firstPt) return;

    ctx.beginPath();
    ctx.moveTo(context.toCanvasX(firstPt[0]), context.toCanvasY(firstPt[1]));
    poly.slice(1).forEach(pt => ctx.lineTo(context.toCanvasX(pt[0]), context.toCanvasY(pt[1])));
    ctx.closePath();
    ctx.clip();
}

function drawShadedRegions(
    ctx: CanvasRenderingContext2D, 
    context: GraphPromptContext, 
    p1Points: [number, number][] | undefined, 
    p2Points: [number, number][] | undefined, 
    seeds: [number, number][], 
    color: string
) {
    const { minX, maxX, minY, maxY } = context.config;
    const margin = 0.5;
    
    seeds.forEach(seed => {
        ctx.save();
        ctx.beginPath();
        const tl = { x: context.toCanvasX(minX - margin), y: context.toCanvasY(maxY + margin) };
        const br = { x: context.toCanvasX(maxX + margin), y: context.toCanvasY(minY - margin) };
        ctx.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.clip();

        if (p1Points && p1Points.length === 2) {
            clipToHalfPlane(ctx, context, p1Points, seed);
        }
        if (p2Points && p2Points.length === 2) {
            clipToHalfPlane(ctx, context, p2Points, seed);
        }

        ctx.fillStyle = color;
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        
        ctx.restore();
    });
}

function renderLine(ctx: CanvasRenderingContext2D, context: GraphPromptContext, line: any, color: string, isActive: boolean) {
    const { points, isDashed } = line;
    if (!points || points.length === 0) return;

    points.forEach((p: [number, number]) => {
        if (isActive) {
            const haloRadius = Math.abs(context.toCanvasX(0.7) - context.toCanvasX(0));
            ctx.beginPath();
            ctx.arc(context.toCanvasX(p[0]), context.toCanvasY(p[1]), haloRadius, 0, Math.PI * 2);
            ctx.fillStyle = color + '26';
            ctx.fill();
        }
        drawPoint(ctx, context, p[0], p[1], color, 10);
    });

    if (points.length === 2) {
        const [p1, p2] = points;
        if (!p1 || !p2) return;
        const { minX, maxX, minY, maxY } = context.config;
        const options = { color, width: 3, dashed: isDashed ? [10, 10] : undefined };
        
        if (p1[0] === p2[0]) {
            drawLine(ctx, context, p1[0], minY, p1[0], maxY, options);
        } else {
            const m = (p2[1] - p1[1]) / (p2[0] - p1[0]);
            const b = p1[1] - m * p1[0];
            drawLine(ctx, context, minX, m * minX + b, maxX, m * maxX + b, options);
        }
    }
}

const renderer: GraphPromptRenderStrategy = {
    type: 'graph',
    renderStatic(ctx, context) {
        const { line1, line2, shadingPoints, activeLayer } = context.data;
        const colors = { 
            line1: '#3498db', 
            line2: '#9b59b6', 
            shading: 'rgba(22, 160, 133, 0.4)' 
        };

        const line1Ready = line1?.points?.length === 2;
        const line2Ready = line2?.points?.length === 2;

        if ((line1Ready || line2Ready) && shadingPoints?.length > 0) {
            drawShadedRegions(ctx, context, line1?.points, line2?.points, shadingPoints, colors.shading);
        }

        if (line1) {
            renderLine(ctx, context, line1, colors.line1, activeLayer === 'line1');
        }

        if (line2) {
            renderLine(ctx, context, line2, colors.line2, activeLayer === 'line2');
        }
    }
};

export default renderer;
