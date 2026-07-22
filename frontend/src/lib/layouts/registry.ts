import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

export const layoutRegistry: Record<string, Component> = {
    GraphPromptNumpadInput: defineAsyncComponent(() => import ('@/components/layouts/GraphPromptNumpadInput.vue')),
    TextPromptGraphInput: defineAsyncComponent(() => import ('@/components/layouts/TextPromptGraphInput.vue')),
    TextPromptNumpadInput: defineAsyncComponent(() => import ('@/components/layouts/TextPromptNumpadInput.vue')),
    MCAPLineGraphInput: defineAsyncComponent(() => import ('@/components/layouts/MCAPLineGraphInput.vue')),
    MCAPSystemInequalityGraphInput: defineAsyncComponent(() => import ('@/components/layouts/MCAPSystemInequalityGraphInput.vue')),
    MCAPParabolaGraphInput: defineAsyncComponent(() => import ('@/components/layouts/MCAPParabolaGraphInput.vue')),
    MCAPTransformationGraphInput: defineAsyncComponent(() => import ('@/components/layouts/MCAPTransformationGraphInput.vue')),
};

export function getLayoutComponent(layoutName: string): Component | undefined {
    const component = layoutRegistry[layoutName];
    if (!component) {
        console.error(`Layout "${layoutName}" is not registered.`);
    }
    return component;
}
