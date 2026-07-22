import type { GraphPromptRenderStrategy, GraphPromptContext, Point } from '@/types';
import { STYLE } from '@/lib/graphics/drawing';

export default {
    type: 'graph',
    renderStatic(ctx: CanvasRenderingContext2D, context: GraphPromptContext) {
        const data = context.data || {};
        const points = data.points as Point[];
        const parent = data.parent;

        ctx.save();

        if (parent) {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            let first = true;
            for (let x = context.config.minX; x <= context.config.maxX; x += 0.1) {
                const y = parent.a * Math.pow(x - parent.h, 2) + parent.k;
                const cx = context.toCanvasX(x);
                const cy = context.toCanvasY(y);
                if (first) { ctx.moveTo(cx, cy); first = false; } 
                else { ctx.lineTo(cx, cy); }
            }
            ctx.stroke();
        }

        if (points && points.length >= 2) {
            const vertex = points.find(p => p.id === 'vertex');
            const curvePoint = points.find(p => p.id === 'curve');
            const activePointId = data.activePointId;

            if (vertex && curvePoint && !activePointId) {
                const h = vertex.x;
                const k = vertex.y;
                const dx = curvePoint.x - h;
        
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                if (dx === 0) {
                    ctx.beginPath();
                    ctx.moveTo(context.toCanvasX(h), context.toCanvasY(context.config.minY));
                    ctx.lineTo(context.toCanvasX(h), context.toCanvasY(context.config.maxY));
                    ctx.stroke();
                } else {
                    const a = (curvePoint.y - k) / (dx * dx);
                    ctx.beginPath();
                    let first = true;
                    for (let x = context.config.minX; x <= context.config.maxX; x += 0.1) {
                        const y = a * Math.pow(x - h, 2) + k;
                        const cx = context.toCanvasX(x);
                        const cy = context.toCanvasY(y);
                        if (first) { ctx.moveTo(cx, cy); first = false; } 
                        else { ctx.lineTo(cx, cy); }
                    }
                    ctx.stroke();
                }
            }

            points.forEach(p => {
                const cx = context.toCanvasX(p.x);
                const cy = context.toCanvasY(p.y);
                const isDragging = p.id === activePointId;

                const baseColor = isDragging ? 'rgba(52, 152, 219, 0.6)' : '#3498db';
                ctx.fillStyle = isDragging ? 'rgba(52, 152, 219, 0.4)' : 'rgba(52, 152, 219, 0.2)';
                ctx.beginPath();
                ctx.arc(cx, cy, 15, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.arc(cx, cy, STYLE.point.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        ctx.restore();
    }
} as GraphPromptRenderStrategy;
