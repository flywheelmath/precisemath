import type { GraphFeedbackAnimator } from '@/types';

const animators = new Map<string, GraphFeedbackAnimator>();

export function registerGraphFeedback(name: string, animator: GraphFeedbackAnimator) {
    animators.set(name, animator);
}

export function getGraphFeedback(name: string): GraphFeedbackAnimator | undefined {
    return animators.get(name);
}

const modules = import.meta.glob('./animators/*.ts', { eager: true });
for (const path in modules) {
    const mod = modules[path] as { default: GraphFeedbackAnimator };
    const name = path.split('/').pop()?.replace(/\.ts$/, '') || 'unknown';

    if (mod.default) {
        registerGraphFeedback(name, mod.default);
    }
}
