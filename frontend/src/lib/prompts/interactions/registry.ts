import type { InteractionStrategy } from '@/types';

const strategies = new Map<string, InteractionStrategy>();

export function registerStrategy(name: string, strategy: InteractionStrategy) {
    strategies.set(name, strategy);
}

export function getStrategy(name: string): InteractionStrategy | undefined {
    return strategies.get(name);
}

const modules = import.meta.glob('./strategies/*.ts', { eager: true });
for (const path in modules) {
    const mod = modules[path] as { default: InteractionStrategy };
    const name = path.split('/').pop()?.replace(/\.ts$/, '') || 'unknown';
    if (mod.default) {
        registerStrategy(name, mod.default);
    }
}
