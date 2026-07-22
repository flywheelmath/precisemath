export function getThemeColor(variableName: string, fallback: string = '#000000'): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return value || fallback;
}

export function getDPR(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
}
