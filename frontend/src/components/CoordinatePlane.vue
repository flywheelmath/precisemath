<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { PropType } from 'vue';
import type { 
  FeedbackState,
  GraphPromptContext,
  GraphInteractionStrategy,
} from '@/types';
import { getStrategy } from '@/lib/prompts/interactions/registry';
import { getRenderer } from '@/lib/prompts/renderers/registry';
import { getGraphFeedback } from '@/lib/feedback/graph/registry';
import { STYLE } from '@/lib/graphics/drawing';
import { getDPR } from '@/lib/graphics/theme';
import { useTheme } from '@/composables/useTheme';

const props = defineProps({
    minX: { type: Number, default: -10 },
    maxX: { type: Number, default: 10 },
    minY: { type: Number, default: -10 },
    maxY: { type: Number, default: 10 },
    gridStep: { type: Number, default: 1 },
    tickLabelXAlign: {
        type: String as PropType<CanvasTextAlign>,
        default: 'center'
    },
    tickLabelXBaseline: {
        type: String as PropType<CanvasTextBaseline>,
        default: 'top'
    },
    tickLabelYAlign: {
        type: String as PropType<CanvasTextAlign>,
        default: 'right'
    },
    tickLabelYBaseline: {
        type: String as PropType<CanvasTextBaseline>,
        default: 'middle'
    },
    promptData: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    renderMode: { 
      type: String, 
      default: null,
    },
    interactionMode: { 
      type: String, 
      default: null,
    },
    feedbackState: { 
      type: Object as PropType<FeedbackState>, 
      required: true,
    },
});

const emit = defineEmits(['point-selected']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hoverPoint = ref<{ x: number; y: number } | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
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

const toCanvasX = (x: number) => ((x - props.minX) / (props.maxX - props.minX)) * logicalSize.width;
const toCanvasY = (y: number) => ((props.maxY - y) / (props.maxY - props.minY)) * logicalSize.height;
const fromCanvasX = (cx: number) => (cx / logicalSize.width) * (props.maxX - props.minX) + props.minX;
const fromCanvasY = (cy: number) => props.maxY - (cy / logicalSize.height) * (props.maxY - props.minY);

const getContext = (): GraphPromptContext => ({
  data: props.promptData,
  config: { 
    minX: props.minX,
    maxX: props.maxX,
    minY: props.minY,
    maxY: props.maxY,
  },
  toCanvasX,
  toCanvasY,
});

function drawStaticLayer() {
  if (!ctx) return;
  const renderer = getRenderer(props.renderMode);
  if (renderer && renderer.type === 'graph') {
    renderer.renderStatic(ctx, getContext());
  }
}

function drawInteractionLayer() {
  if (!ctx || !hoverPoint.value || !props.interactionMode) return;
  const strategy = getStrategy(props.interactionMode);
  if (strategy && strategy.type === 'graph') {
    (strategy as GraphInteractionStrategy).renderOverlay(ctx, hoverPoint.value, getContext());
  }
}

function drawFeedbackLayer() {
  if (!ctx || !props.feedbackState.type) return;
  const animator = getGraphFeedback(props.feedbackState.type);
  if (animator && animator.type === 'graph') {
    animator.animate({
      ctx,
      feedbackState: props.feedbackState,
      context: getContext(),
      animationProgress: animationProgress.value,
    });
  }
}

function drawCursor() {
  if (!ctx || !hoverPoint.value) return;
  ctx.fillStyle = STYLE.hoverPoint.color;
  ctx.beginPath();
  ctx.arc(toCanvasX(hoverPoint.value.x), toCanvasY(hoverPoint.value.y), STYLE.hoverPoint.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  if (!ctx) return;
  ctx.fillStyle = STYLE.background;
  ctx.fillRect(0, 0, logicalSize.width, logicalSize.height);
}

function drawGridLines() {
  if (!ctx) return;
  ctx.strokeStyle = STYLE.grid.color;
  ctx.lineWidth = STYLE.grid.width;

  for (let x = props.minX; x <= props.maxX; x += props.gridStep) {
    ctx.beginPath();
    ctx.moveTo(toCanvasX(x), 0);
    ctx.lineTo(toCanvasX(x), logicalSize.height);
    ctx.stroke();
  }
  for (let y = props.minY; y <= props.maxY; y += props.gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(y));
    ctx.lineTo(logicalSize.width, toCanvasY(y));
    ctx.stroke();
  }

  ctx.strokeStyle = STYLE.axis.color;
  ctx.lineWidth = STYLE.axis.width;

  ctx.beginPath();
  ctx.moveTo(toCanvasX(0), 0);
  ctx.lineTo(toCanvasX(0), logicalSize.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, toCanvasY(0));
  ctx.lineTo(logicalSize.width, toCanvasY(0));
  ctx.stroke();
}

function drawTickLabels() {
  if (!ctx) return;
  const tickOffset = 15;

  ctx.fillStyle = STYLE.text.color;
  ctx.font = STYLE.text.font;

  ctx.textAlign = props.tickLabelXAlign;
  ctx.textBaseline = props.tickLabelXBaseline;

  const xLabelOffset = ctx.textBaseline === 'bottom' ? -tickOffset / 2 : tickOffset / 2;

  for (let x = props.minX; x <= props.maxX; x += props.gridStep) {
    if (x !== 0) {
      ctx.fillText(String(x), toCanvasX(x), toCanvasY(0) + xLabelOffset);
    }
  }

  ctx.textAlign = props.tickLabelYAlign;
  ctx.textBaseline = props.tickLabelYBaseline;

  const yLabelOffset = ctx.textAlign === 'left' ? tickOffset / 2 : -tickOffset / 2;

  for (let y = props.minY; y <= props.maxY; y += props.gridStep) {
    if (y !== 0) {
      ctx.fillText(String(y), toCanvasX(0) + yLabelOffset, toCanvasY(y));
    }
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('0', toCanvasX(0) - 5, toCanvasY(0) + 5);
}

function redrawCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, logicalSize.width, logicalSize.height);

  drawBackground();
  drawGridLines();

  if (props.feedbackState.type) {
    drawFeedbackLayer();
  } else {
    drawStaticLayer();
    drawInteractionLayer();
    drawCursor();
  }
  drawTickLabels();
}

const animationProgress = ref(0);
let animationFrameId: number | null = null;
const ANIMATION_DURATION = 500;

const animate = (startTime: number) => {
  const elapsedTime = Date.now() - startTime;
  animationProgress.value = Math.min(elapsedTime / ANIMATION_DURATION, 1);
  redrawCanvas();
  if (elapsedTime < ANIMATION_DURATION) {
    animationFrameId = requestAnimationFrame(() => animate(startTime));
  }
};

const startAnimation = () => {
  stopAnimation();
  animationProgress.value = 0;
  const startTime = Date.now();
  animationFrameId = requestAnimationFrame(() => animate(startTime));
};

const stopAnimation = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

function handleMouseMove(event: MouseEvent) {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const logicalX = Math.round(fromCanvasX(mouseX) / props.gridStep) * props.gridStep;
  const logicalY = Math.round(fromCanvasY(mouseY) / props.gridStep) * props.gridStep;
  hoverPoint.value = { x: logicalX, y: logicalY };
}

function handleMouseLeave() {
  hoverPoint.value = null;
}

function handleClick() {
  if (hoverPoint.value) {
    emit('point-selected', [hoverPoint.value.x, hoverPoint.value.y]);
  }
}

function setupCanvasResolution() {
  if (!canvasRef.value || !ctx) return;

  const dpr = getDPR();

  canvasRef.value.width = logicalSize.width * dpr;
  canvasRef.value.height = logicalSize.height * dpr;

  canvasRef.value.style.width = `${logicalSize.width}px`;
  canvasRef.value.style.height = `${logicalSize.height}px`;

  ctx.scale(dpr, dpr);
}

const themeMedia = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const handleThemeChange = () => redrawCanvas();

const { isDark } = useTheme();

watch(isDark, () => {
  setTimeout(() => redrawCanvas(), 0);
});

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    setupCanvasResolution();
    redrawCanvas();

    themeMedia?.addEventListener('change', handleThemeChange);
  }
});

watch(() => props.promptData, () => { redrawCanvas();}, { deep: true });

watch([
  () => props.minX,
  () => props.maxX,
  () => props.minY,
  () => props.maxY,
], redrawCanvas);

watch(() => props.feedbackState.type, (newType) => {
  if (newType) {
    startAnimation();
  } else {
    stopAnimation();
    redrawCanvas();
  }
}, { deep: true });

onUnmounted(() => {
  stopAnimation();
  themeMedia?.removeEventListener('change', handleThemeChange);

});

watch(hoverPoint, redrawCanvas);
watch(() => props.renderMode, redrawCanvas);
watch(() => props.interactionMode, redrawCanvas);
</script>

<template>
    <canvas
        ref="canvasRef"
        width="440"
        height="440"
        class="coordinate-plane"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
    ></canvas>
</template>

<style scoped>
.coordinate-plane {
    cursor: crosshair;
    border-radius: 0px;
}
</style>
