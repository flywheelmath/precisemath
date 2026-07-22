import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import type { Prompt, SkillLevelData } from '@/types';

export type ActiveLayer = 'line1' | 'line2' | 'solution';

function getRegionKey(p: [number, number], l1: [number, number][], l2: [number, number][]): string {
    const getSide = (pt: [number, number], line: [number, number][]) => {
        if (line.length < 2) return 'null';
        const [p1, p2] = line;
        if (!p1 || !p2) return 'null';
	const val = (p2[0] - p1[0]) * (pt[1] - p1[1]) - (p2[1] - p1[1]) * (pt[0] - p1[0]);
	if (Math.abs(val) < 1e-6) return '0';
        return Math.sign(val).toString();
    };
    return `${getSide(p, l1)}|${getSide(p, l2)}`;
}

export function useSystemInequalityState(
    prompt: Ref<Prompt | null>,
    skillLevels: Ref<SkillLevelData[]>
) {
    const activeLayer = ref<ActiveLayer>('line1');
    const line1Points = ref<[number, number][]>([]);
    const line2Points = ref<[number, number][]>([]);
    const line1IsDashed = ref<boolean>(false);
    const line2IsDashed = ref<boolean>(false);
    const shadingPoints = ref<[number, number][]>([]);
    const dragIndex = ref<number | null>(null);

    const interactionConfig = computed(() => {
        if (!prompt.value) return 'default';
        const meta = skillLevels.value?.find(l => l.skill_level_rank === prompt.value!.skill_level_rank);
        return meta?.interaction_config || 'default';
    });

    const isLocked = computed(() => 
        ['system-region-only', 'system-boundary-and-region'].includes(interactionConfig.value)
    );

    const setActiveLayer = (layer: ActiveLayer) => { 
        activeLayer.value = layer; 
        if (layer === 'line1' || layer === 'line2') shadingPoints.value = [];
    };

    function handlePointClick(p: [number, number], emitUpdate: (val: any) => void) {
        if (!p) return;
        if (activeLayer.value === 'solution') {
            if (line1Points.value.length < 2 && line2Points.value.length < 2) return;
            const key = getRegionKey(p, line1Points.value, line2Points.value);
	    if (key.includes('0')) return;
	    const hasExisting = shadingPoints.value.some(seed =>
		getRegionKey(seed, line1Points.value, line2Points.value) === key
	    );
	    if (hasExisting) {
		shadingPoints.value = shadingPoints.value.filter(seed =>
		    getRegionKey(seed, line1Points.value, line2Points.value) !== key
		);
	    } else {
		shadingPoints.value.push(p);
	    }
        } else {
            if (isLocked.value) return; 
            
            const target = activeLayer.value === 'line1' ? line1Points : line2Points;
            const existingIdx = target.value.findIndex(pt => pt && Math.sqrt(Math.pow(pt[0]-p[0], 2) + Math.pow(pt[1]-p[1], 2)) <= 0.4);
            if (existingIdx !== -1) target.value.splice(existingIdx, 1);
            else if (target.value.length === 2) target.value[1] = p;
            else target.value.push(p);
        }
        syncResponse(emitUpdate);
    }

    function handleDragStart(p: [number, number]) {
        if (activeLayer.value === 'solution' || isLocked.value) return;
        
        const target = activeLayer.value === 'line1' ? line1Points : line2Points;
        const idx = target.value.findIndex(pt => pt && Math.sqrt(Math.pow(pt[0]-p[0],2)+Math.pow(pt[1]-p[1],2)) <= 0.6);
        if (idx !== -1) dragIndex.value = idx;
    }

    function handleDragEnd(p: [number, number], emitUpdate: (val: any) => void) {
        if (dragIndex.value !== null) {
            const target = activeLayer.value === 'line1' ? line1Points : line2Points;
            target.value[dragIndex.value] = p;
            dragIndex.value = null;
	    const seenKeys = new Set<string>();
	    shadingPoints.value = shadingPoints.value.filter(seed => {
		const key = getRegionKey(seed, line1Points.value, line2Points.value);
		if (key.includes('0') || seenKeys.has(key)) return false;
		seenKeys.add(key);
		return true;
	    });
            syncResponse(emitUpdate);
        }
    }

    function syncResponse(emitUpdate: (val: any) => void) {
        emitUpdate({
            lines: [
                { points: [...line1Points.value], isDashed: line1IsDashed.value },
                { points: [...line2Points.value], isDashed: line2IsDashed.value }
            ],
            shadingPoints: [...shadingPoints.value]
        });
    }

    const reset = () => {
        line1Points.value = []; line2Points.value = []; shadingPoints.value = [];
        line1IsDashed.value = false; line2IsDashed.value = false; activeLayer.value = 'line1';
    };

    watch(() => prompt.value, (newPrompt) => {
        reset();
        if (!newPrompt?.data?.inequalities || !isLocked.value) return;

        const ineqs = newPrompt.data.inequalities;
        
        line1Points.value = [
            ineqs[0].basepoint, 
            [ineqs[0].basepoint[0] + ineqs[0].slope[1], ineqs[0].basepoint[1] + ineqs[0].slope[0]]
        ];
        line2Points.value = [
            ineqs[1].basepoint, 
            [ineqs[1].basepoint[0] + ineqs[1].slope[1], ineqs[1].basepoint[1] + ineqs[1].slope[0]]
        ];

        if (interactionConfig.value === 'system-region-only') {
            line1IsDashed.value = ['<', '>'].includes(ineqs[0].relation);
            line2IsDashed.value = ['<', '>'].includes(ineqs[1].relation);
            setActiveLayer('solution');
        } else if (interactionConfig.value === 'system-boundary-and-region') {
            line1IsDashed.value = Math.random() > 0.5;
            line2IsDashed.value = Math.random() > 0.5;
        }
    }, { immediate: true });

    const dynamicConfig = computed(() => ({
        interactionMode: activeLayer.value === 'solution' ? 'point' : 'line-mcap',
        renderMode: 'draw-system-inequalities',
        promptData: {
            activeLayer: activeLayer.value,
            line1: { points: line1Points.value, isDashed: line1IsDashed.value },
            line2: { points: line2Points.value, isDashed: line2IsDashed.value },
            shadingPoints: shadingPoints.value
        }
    }));

    return { 
        activeLayer, line1Points, line2Points, line1IsDashed, line2IsDashed, shadingPoints,
        setActiveLayer, handlePointClick, handleDragStart, handleDragEnd, reset, 
        dynamicConfig, syncResponse, isLocked, interactionConfig 
    };
}
