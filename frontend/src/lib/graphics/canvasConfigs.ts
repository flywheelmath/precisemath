export interface CanvasConfig {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    gridStep: number;
    tickLabelXAlign?: CanvasTextAlign;
    tickLabelXBaseline?: CanvasTextBaseline;
    tickLabelYAlign?: CanvasTextAlign;
    tickLabelYBaseline?: CanvasTextBaseline;
}

const canvasConfigs: Record<string, CanvasConfig> = {
    'q1': {
        minX: 0,
        maxX: 6,
        minY: 0,
        maxY: 6,
        gridStep: 1,
        tickLabelXAlign: 'center',
        tickLabelXBaseline: 'bottom',
        tickLabelYAlign: 'left',
        tickLabelYBaseline: 'middle',
    },
    'full-plane': {
        minX: -6,
        maxX: 6,
        minY: -6,
        maxY: 6,
        gridStep: 1,
        tickLabelXAlign: 'center',
        tickLabelXBaseline: 'top',
        tickLabelYAlign: 'right',
        tickLabelYBaseline: 'middle',
    },
    'full-plane-mcap': {
        minX: -8,
        maxX: 8,
        minY: -8,
        maxY: 8,
        gridStep: 1,
        tickLabelXAlign: 'center',
        tickLabelXBaseline: 'top',
        tickLabelYAlign: 'right',
        tickLabelYBaseline: 'middle',
    }
}

export function getCanvasConfig(name: string | null | undefined): CanvasConfig | {} {
    return name ? canvasConfigs[name] ?? {} : {};
}
