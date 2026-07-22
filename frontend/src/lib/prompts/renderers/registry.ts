import type { GraphPromptRenderStrategy } from '@/types';

const renderers = new Map<string, GraphPromptRenderStrategy>();

const emptyRenderer: GraphPromptRenderStrategy = {
    type: 'graph',
    renderStatic: () => {}
};

export function registerRenderer(name: string, renderer: GraphPromptRenderStrategy) {
    renderers.set(name, renderer);
}

export function getRenderer(name: string | null | undefined): GraphPromptRenderStrategy {
    if (!name) return emptyRenderer;
    return renderers.get(name) || emptyRenderer;
}

const modules = import.meta.glob('./strategies/*.ts', { eager: true });
for (const path in modules) {
    const mod = modules[path] as { default: GraphPromptRenderStrategy };
    const name = path.split('/').pop()?.replace(/\.ts$/, '') || 'unknown';
    if (mod.default) registerRenderer(name, mod.default);
}
