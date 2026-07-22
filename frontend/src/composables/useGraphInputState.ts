import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import type { Prompt, SkillLevelData } from '@/types';

export function useGraphInputState(
    prompt: Ref<Prompt | null>,
    skillLevels: Ref<SkillLevelData[]>
) {
    const userPoints = ref<[number, number][]>([]);
    const isDragging = ref<boolean>(false);
    const draggedPointIndex = ref<number | null>(null);

    const isDashed = ref<boolean | null>(true);
    const shadingSide = ref<'above' | 'below' | null>(null);

    const mode = computed(() => {
	if (!prompt.value) return null;
	const meta = skillLevels.value?.find(l => l.skill_level_rank === prompt.value!.skill_level_rank);
	return meta?.interaction_config || 'default';
    });

    const isInequalityMode = computed(() => [
        'select-interior',
        'select-boundary-type-then-interior',
        'select-boundary-then-interior',
    ].includes(mode.value || ''));

    const isStyleLocked = computed(() => mode.value === 'select-interior');

    const derivedShadingPoint = computed(() => {
        if (!shadingSide.value || userPoints.value.length < 2) return null;

        const [p1, p2] = userPoints.value;
        if (!p1 || !p2) return null;

        const midX = (p1[0] + p2[0]) / 2;
        const midY = (p1[1] + p2[1]) / 2;

        const offset = shadingSide.value === 'above' ? 1 : -1;

        return [midX, midY + offset] as [number, number];
    });

    function setLineStyle(dashed: boolean) {
        isDashed.value = dashed;
    }

    function setShadingSide(side: 'above' | 'below') {
        shadingSide.value = side;
    }

    watch(() => prompt.value, (newPrompt) => {
        reset();
        if (!newPrompt || !newPrompt.data) return;

        const { basepoint, slope, relation } = newPrompt.data;
        const hasLineData = basepoint && slope;

        if (mode.value === 'select-interior' && hasLineData) {
            userPoints.value = [
                basepoint,
                [basepoint[0] + slope[1], basepoint[1] + slope[0]]
            ];
            isDashed.value = ['<', '>'].includes(relation);
            shadingSide.value = null;
        } else if (mode.value === 'select-boundary-type-then-interior' && hasLineData) {
            userPoints.value = [
                basepoint,
                [basepoint[0] + slope[1], basepoint[1] + slope[0]],
            ];
            isDashed.value = true;
            shadingSide.value = null;
        } else {
            isDashed.value = true;
        }
    }, { immediate: true });

    const dynamicConfig = computed(() => {
        if (mode.value === 'graph-line-mcap-default') {
            return {
                interaction: 'line-mcap',
                render: 'draw-user-line',
                extraData: { userPoints: [...userPoints.value] }
            };
        }

        const count = userPoints.value.length;
        if (mode.value === 'select-two-points') {
            if (count === 1) return {
                interaction: 'line-anchor',
                render: 'draw-user-line',
                extraData: { anchorPoint: userPoints.value[0], userPoints: userPoints.value },
            };
            return { interaction: null, render: 'draw-user-line', extraData: { userPoints: userPoints.value } };
        }

        if (isInequalityMode.value) {
            if (count < 2) {
                if (count === 1) {
                    return {
                        interaction: 'line-anchor',
                        render: 'draw-inequality',
                        extraData: {
                            anchorPoint: userPoints.value[0],
                            userPoints: userPoints.value,
                            isDashed: true,
                            shadingPoint: derivedShadingPoint.value,
                        }
                    };
                }
                return { interaction: null, render: 'draw-inequality', extraData: { userPoints: [] } };
            }

            return {
                interaction: null,
                render: 'draw-inequality',
                extraData: {
                    userPoints: userPoints.value,
                    isDashed: isDashed.value,
                    shadingPoint: derivedShadingPoint.value,
                }
            };
        }

        return { interaction: null, render: null, extraData: {} };
    });

    function handlePointClick(p: [number, number], emitSubmit: (val: any) => void) {
        if (mode.value === 'graph-line-mcap-default') {
            const count = userPoints.value.length;
            const threshold = count === 2 ? 0.2 : 0.4;

            const existingIndex = userPoints.value.findIndex(pt => {
                const dx = pt[0] - p[0];
                const dy = pt[1] - p[1];
                return Math.sqrt(dx*dx + dy*dy) <= threshold;
            });

            if (existingIndex !== -1) {
                userPoints.value.splice(existingIndex, 1);
            } else if (userPoints.value.length < 2) {
                userPoints.value.push(p);
            }

            emitSubmit(userPoints.value.length === 2 ? [...userPoints.value] : null);
            return;
        }

        if (mode.value === 'select-two-points') {
            if (userPoints.value.length < 2) {
                userPoints.value.push(p);
            }
            if (userPoints.value.length === 2) {
                emitSubmit(userPoints.value);
            }
            return;
        }

        if (isInequalityMode.value) {
            if (userPoints.value.length < 2) {
                userPoints.value.push(p);
                return;
            }
        } else {
            emitSubmit(p);
        }
    }

    function handleDragStart(p: [number, number]) {
        const threshold = 0.2;
        const index = userPoints.value.findIndex(pt => {
            const dx = pt[0] - p[0];
            const dy = pt[1] - p[1];
            return Math.sqrt(dx*dx + dy*dy) <= threshold;
        });

        if (index != -1) {
            isDragging.value = true;
            draggedPointIndex.value = index;
            userPoints.value.splice(index, 1);
        }
    }

    function handleDragEnd(p: [number, number], emitSubmit: (val: any) => void) {
        if (isDragging.value && draggedPointIndex.value !== null) {
            userPoints.value[draggedPointIndex.value] = p;
            isDragging.value = false;
            draggedPointIndex.value = null;
            if (userPoints.value.length === 2){
                emitSubmit([...userPoints.value]);
            }
        }
    }

    function reset() {
        userPoints.value = [];
        isDashed.value = true;
        shadingSide.value = null;
    }


    return {
        userPoints,
        dynamicConfig,
        handlePointClick,
        handleDragStart,
        handleDragEnd,
        isDragging,
        mode,
        reset,
        isInequalityMode,
        isDashed,
        shadingSide,
        derivedShadingPoint,
        setLineStyle,
        setShadingSide,
        isStyleLocked,
    };
}
