import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

type ThemePreference = 'light' | 'dark' | 'auto';

const preference = ref<ThemePreference>(
    (localStorage.getItem('theme-preference') as ThemePreference) || 'auto'
);
const systemIsDark = ref(false);

export function useTheme() {
    const isDark = computed(() => {
        if (preference.value === 'auto') return systemIsDark.value;
        return preference.value === 'dark';
    });

    function updateSystemTheme(e: MediaQueryListEvent | MediaQueryList) {
        systemIsDark.value = e.matches;
    }

    function setPreference(newPref: ThemePreference) {
        preference.value = newPref;
        localStorage.setItem('theme-preference', newPref);
    }

    function cycleTheme() {
        if (preference.value === 'auto') setPreference('light');
        else if (preference.value === 'light') setPreference('dark');
        else setPreference('auto');
    }

    onMounted(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        updateSystemTheme(media);
        media.addEventListener('change', updateSystemTheme);
        watch(isDark, (dark) => {
            document.documentElement.classList.toggle('dark', dark);
        }, { immediate: true });
    });

    return {
        preference,
        isDark,
        cycleTheme,
    };
}
