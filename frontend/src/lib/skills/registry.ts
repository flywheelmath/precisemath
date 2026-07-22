import type { SkillModule } from '@/types';

const modules: Record<string, SkillModule> = {};
const skillFiles = import.meta.glob('./modules/**/*.ts', { eager: true });

for (const path in skillFiles) {
    const module = (skillFiles[path] as any).default as SkillModule;
    const skillId = path.replace(/^\.\/modules\//, '').replace(/\.ts$/, '');

    if (module) {
        modules[skillId] = module;
    }
}

export function registerSkill(name: string, module: SkillModule) {
    modules[name] = module;
}

export function getSkillModule(name: string): SkillModule | undefined {
    return modules[name];
}

export interface RegisteredSkill {
    path: string;
    displayName: string;
    sortOrder?: number;
}

export interface Category {
    name: string;
    sortOrder: number;
    skills: RegisteredSkill[];
}

function formatName(path: string): string {
    const parts = path.split('/');
    const formattedParts = parts.map(part => part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    return formattedParts.join(': ');
}

export function getGroupedSkills(): Category[] {
    const grouped: Record<string, RegisteredSkill[]> = {};

    Object.keys(modules).forEach(path => {
        const module = modules[path];
        if (!module) return;

        const [categorySlug, skillSlug] = path.split('/');

        if (!categorySlug || !skillSlug) return;

        if (!grouped[categorySlug]) {
            grouped[categorySlug] = [];
        }

        grouped[categorySlug].push({
            path,
            displayName: module.displayName || formatName(skillSlug),
            sortOrder: module.sortOrder,
        });
    });

    const categories = Object.keys(grouped).map(categorySlug => {
        const skills = grouped[categorySlug];
        if (!skills) return;

        skills.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

        const minOrder = skills.reduce(
            (min, skill) => Math.min(min, skill.sortOrder ?? Infinity),
                Infinity
        );

        return {
            name: formatName(categorySlug),
            sortOrder: minOrder,
            skills: skills,
        };
    }).filter((c): c is Category => c !== null);

    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    return categories;
}
