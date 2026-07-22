<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { PropType } from 'vue';
import type { FeedbackState, GraphPromptContext, GraphInteractionStrategy } from '@/types';
import { getStrategy } from '@/lib/prompts/interactions/registry';
import { getRenderer } from '@/lib/prompts/renderers/registry';
import { getGraphFeedback } from '@/lib/feedback/graph/registry';
import { STYLE } from '@/lib/graphics/drawing';
import { getDPR } from '@/lib/graphics/theme';

const props = defineProps({
    minX: { type: Number, default: -10 },
    maxX: { type: Number, default: 10 },
    minY: { type: Number, default: -10 },
    maxY: { type: Number, default: 10 },
    gridStep: { type: Number, default: 1 },
    tickLabelXAlign: { type: String as PropType<CanvasTextAlign>, default: 'center' },
    tickLabelXBaseline: { type: String as PropType<CanvasTextBaseline>, default: 'top' },
    tickLabelYAlign: { type: String as PropType<CanvasTextAlign>, default: 'right' },
    tickLabelYBaseline: { type: String as PropType<CanvasTextBaseline>, default: 'middle' },
    promptData: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
    renderMode: { type: String, default: null },
    interactionMode: { type: String, default: null },
    feedbackState: { type: Object as PropType<FeedbackState>, required: true },
});

const emit = defineEmits<{
  (e: 'point-selected', point: [number, number]): void;
  (e: 'drag-start', point: [number, number]): void;
  (e: 'drag-move', point: [number, number]): void;
  (e: 'drag-end', point: [number, number]): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hoverPoint = ref<{ x: number; y: number } | null>(null);
let logicalSize = { width: 420, height: 420 };

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    const dpr = getDPR();
    canvasRef.value.width = logicalSize.width * dpr;
    canvasRef.value.height = logicalSize.height * dpr;
    canvasRef.value.style.width = `${logicalSize.width}px`;
    canvasRef.value.style.height = `${logicalSize.height}px`;
    ctx?.scale(dpr, dpr);
    redrawCanvas();
  }
});


let ctx: CanvasRenderingContext2D | null = null;

let startScreenPos = { x: 0, y: 0 };
let isMouseDown = false;
let hasDragStarted = false;

const toCanvasX = (x: number) => ((x - props.minX) / (props.maxX - props.minX)) * logicalSize.width;
const toCanvasY = (y: number) => ((props.maxY - y) / (props.maxY - props.minY)) * logicalSize.height;
const fromCanvasX = (cx: number) => (cx / logicalSize.width) * (props.maxX - props.minX) + props.minX;
const fromCanvasY = (cy: number) => props.maxY - (cy / logicalSize.height) * (props.maxY - props.minY);

const getLogicalFromEvent = (e: MouseEvent, snap: boolean = true): [number, number] => {
  if (!canvasRef.value) return [0, 0];
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const rawX = fromCanvasX(x);
  const rawY = fromCanvasY(y);

  if (!snap) return [rawX, rawY];

  return [
    Math.round(rawX / props.gridStep) * props.gridStep,
    Math.round(rawY / props.gridStep) * props.gridStep
  ];
};

const getContext = (): GraphPromptContext => ({
  data: props.promptData,
  config: { 
    minX: props.minX,
    maxX: props.maxX,
    minY: props.minY,
    maxY: props.maxY
  },
  toCanvasX,
  toCanvasY,
});

let startLogicalPos: [number, number] = [0, 0];

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value) return;

  const snapped = getLogicalFromEvent(event, true);
  const raw = getLogicalFromEvent(event, false);
  hoverPoint.value = { x: snapped[0], y: snapped[1] };
  const isSticky = !!props.promptData?.activePointId;

  if (isMouseDown || isSticky) {
    if (isSticky || hasDragStarted) {
      emit('drag-move', raw);
    } else {
      const dist = Math.hypot(event.clientX - startScreenPos.x, event.clientY - startScreenPos.y);
      if (dist > 5) {
        hasDragStarted = true;
        emit('drag-start', startLogicalPos); 
      }
    }
  }
}


const handleMouseDown = (e: MouseEvent) => {
  startScreenPos = { x: e.clientX, y: e.clientY };
  startLogicalPos = getLogicalFromEvent(e, true);
  isMouseDown = true;
  hasDragStarted = false;
};

const handleMouseUp = (e: MouseEvent) => {
  if (isMouseDown) {
    const p = getLogicalFromEvent(e, true);
    if (hasDragStarted) {
      emit('drag-end', p);
    } else {
      emit('point-selected', p);
    }
    isMouseDown = false;
    hasDragStarted = false;
  }
};

function redrawCanvas() {
  if (!ctx) return;
  const { minX, maxX, minY, maxY, gridStep } = props;
  ctx.clearRect(0, 0, logicalSize.width, logicalSize.height);
  
  ctx.fillStyle = STYLE.background;
  ctx.fillRect(0, 0, logicalSize.width, logicalSize.height);
  
  ctx.strokeStyle = STYLE.grid.color;
  ctx.lineWidth = STYLE.grid.width;
  for (let x = minX; x <= maxX; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), logicalSize.height); ctx.stroke();
  }
  for (let y = minY; y <= maxY; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(logicalSize.width, toCanvasY(y)); ctx.stroke();
  }

  ctx.strokeStyle = STYLE.axis.color;
  ctx.lineWidth = STYLE.axis.width;
  ctx.beginPath(); ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), logicalSize.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(logicalSize.width, toCanvasY(0)); ctx.stroke();

  ctx.fillStyle = STYLE.text.color;
  ctx.font = 'bold 12px sans-serif'; 
  
  ctx.textAlign = props.tickLabelXAlign;
  ctx.textBaseline = props.tickLabelXBaseline;
  for (let x = minX; x <= maxX; x += gridStep) {
    if (x === 0) continue;
    ctx.fillText(x.toString(), toCanvasX(x), toCanvasY(0) + 8);
  }

  ctx.textAlign = props.tickLabelYAlign;
  ctx.textBaseline = props.tickLabelYBaseline;
  for (let y = minY; y <= maxY; y += gridStep) {
    if (y === 0) continue;
    ctx.fillText(y.toString(), toCanvasX(0) - 10, toCanvasY(y));
  }

  const context = getContext();
  const renderer = getRenderer(props.renderMode);
  if (renderer?.type === 'graph') renderer.renderStatic(ctx, context);

  if (props.feedbackState && props.feedbackState.type) {
    const animator = getGraphFeedback(props.feedbackState.type);
    if (animator?.type === 'graph') animator.animate({ ctx, feedbackState: props.feedbackState, context: context, animationProgress: 1.0 });
  } else if (hoverPoint.value && props.interactionMode) {
    const strategy = getStrategy(props.interactionMode);
    if (strategy?.type === 'graph') {
      (strategy as GraphInteractionStrategy).renderOverlay(ctx, { x: hoverPoint.value.x, y: hoverPoint.value.y }, context);
    }
  }

  if (hoverPoint.value && !props.promptData?.activePointId) {
    ctx.fillStyle = STYLE.hoverPoint.color;
    ctx.beginPath();
    ctx.arc(toCanvasX(hoverPoint.value.x), toCanvasY(hoverPoint.value.y), STYLE.hoverPoint.radius, 0, Math.PI * 2); 
    ctx.fill();
  }
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    const dpr = getDPR();
    canvasRef.value.width = logicalSize.width * dpr;
    canvasRef.value.height = logicalSize.height * dpr;
    canvasRef.value.style.width = `${logicalSize.width}px`;
    canvasRef.value.style.height = `${logicalSize.height}px`;
    ctx?.scale(dpr, dpr);
    redrawCanvas();
  }
});

watch(() => [props.promptData, props.interactionMode, props.feedbackState, hoverPoint.value], redrawCanvas, { deep: true });
</script>

<template>
  <canvas
    ref="canvasRef"
    class="coordinate-plane"
    @mousemove="handleMouseMove"
    @mouseleave="() => { isMouseDown = false; hoverPoint = null; }"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  ></canvas>
</template>

<style scoped>
.coordinate-plane { cursor: crosshair; display: block; border-radius: 4px; }
</style>
