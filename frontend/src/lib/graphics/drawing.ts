import { getThemeColor } from './theme';

const DASHED = [5, 5];
const SOLID: number[] = [];

export const STYLE = {
    get point() { return { radius: 10, color: getThemeColor('--color-graph-primary') }; },
    get basePoint() { return { radius: 10, color: getThemeColor('--color-graph-primary') }; },
    get correctPoint() { return { radius: 10, color: getThemeColor('--color-graph-correct') }; },
    get hoverPoint() { return { radius: 10, color: getThemeColor('--color-graph-hover') }; },
    get incorrectPoint() { return { radius: 10, color: getThemeColor('--color-graph-incorrect') }; },

    get line() { return { width: 4, color: getThemeColor('--color-graph-primary'), dashed: SOLID }; },
    get correctLine() { return { width: 4, color: getThemeColor('--color-graph-correct'), dashed: SOLID }; },
    get hoverLine() { return { width: 4, color: getThemeColor('--color-graph-hover'), dashed: DASHED }; },
    get highLightLine() { return { width: 8, color: getThemeColor('--color-graph-hover'), dashed: SOLID }; },
    get ghostLine() { return { width: 4, color: getThemeColor('--color-ui-secondary'), dashed: [2, 6] }; },
    get incorrectLine() { return { width: 4, color: getThemeColor('--color-graph-incorrect'), dashed: DASHED }; },
    get auxLine() { return { width: 4, color: getThemeColor('--color-ui-secondary'), dashed: DASHED }; },

    get axis() { return { width: 4, color: getThemeColor('--color-graph-axis') }; },
    get grid() { return { width: 2, color: getThemeColor('--color-graph-grid') }; },
    get text() { return { font: '14px sans-serif', color: getThemeColor('--color-graph-text') }; },

    get background() { return getThemeColor('--color-graph-bg'); }
};

export interface DrawContext {
    toCanvasX: (x: number) => number;
    toCanvasY: (y: number) => number;
    config: { 
        minX: number,
        maxX: number,
        minY: number,
        maxY: number,
    };
}

export function drawPoint(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x: number,
    y: number,
    color: string | null = null,
    radius: number | null = null,
) {
    const cx = context.toCanvasX(x);
    const cy = context.toCanvasY(y);

    ctx.fillStyle = color || STYLE.point.color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius || STYLE.point.radius, 0, Math.PI * 2);
    ctx.fill();
}

export function drawLine(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: { 
        color?: string,
        width?: number,
        dashed?: number[],
    } = {}
) {
    const defaultStyle = STYLE.line;
    const color = options.color || defaultStyle.color;
    const width = options.width || defaultStyle.width;
    const dashed = options.dashed || defaultStyle.dashed;

    const cx1 = context.toCanvasX(x1);
    const cy1 = context.toCanvasY(y1);
    const cx2 = context.toCanvasX(x2);
    const cy2 = context.toCanvasY(y2);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashed);

    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();
    ctx.setLineDash(SOLID);
}

export function drawLineHorizontal(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    y: number,
    options: {
        color?: string,
        width?: number,
        dashed?: number[],
    } = {}
) {
    drawLine(ctx, context, context.config.minX, y, context.config.maxX, y, options);
}

export function drawLineVertical(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x: number,
    options: {
        color?: string,
        width?: number,
        dashed?: number[],
    } = {}
) {
    drawLine(ctx, context, x, context.config.minY, x, context.config.maxY, options);
}

export function drawInfiniteLine(ctx: CanvasRenderingContext2D, context: DrawContext, p1: [number, number], p2: [number, number], options: any = {}) {
    const { minX, maxX, minY, maxY } = context.config;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    if (x1 === x2) return drawLine(ctx, context, x1, minY, x1, maxY, options);
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    drawLine(ctx, context, minX, m * minX + b, maxX, m * maxX + b, options);
}

export function animateLine(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    progress: number,
    options: {
        color?: string,
        width?: number,
        dashed?: number[],
    } = {},
) {
    const defaultStyle = STYLE.line;
    const color = options.color || defaultStyle.color;
    const width = options.width || defaultStyle.width;
    const dashed = options.dashed || defaultStyle.dashed;

    const currentX = x1 + (x2 - x1) * progress;
    const currentY = y1 + (y2 - y1) * progress;

    drawLine(ctx, context, x1, y1, currentX, currentY, options);
}

export function animateLineHorizontal(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x: number,
    y: number,
    progress: number,
    options: {
        color?: string,
        width?: number,
        dashed?: number[],
    } = {},
) {
    animateLine(ctx, context, x, y, context.config.minX, y, progress, options);
    animateLine(ctx, context, x, y, context.config.maxX, y, progress, options);
}

export function animateLineVertical(
    ctx: CanvasRenderingContext2D,
    context: DrawContext,
    x: number,
    y: number,
    progress: number,
    options: {
        color?: string,
        width?: number,
        dashed?: number[],
    } = {},
) {
    animateLine(ctx, context, x, y, x, context.config.minY, progress, options);
    animateLine(ctx, context, x, y, x, context.config.maxY, progress, options);
}

export function generateParabolaPath(vertex: {x: number, y: number}, point: {x: number, y: number}) {
  const h = vertex.x;
  const k = vertex.y;
  const xp = point.x;
  const yp = point.y;

  const dx = xp - h;
  if (dx === 0) return "";

  const a = (yp - k) / (dx * dx);

  let path = "";
  const step = 0.2;

  for (let x = -10; x <= 10; x += step) {
    const y = a * Math.pow(x - h, 2) + k;

    if (y >= -11 && y <= 11) {
      const command = path === "" ? "M" : "L";
      path += `${command} ${x} ${y} `;
    }
  }
  return path;
}
