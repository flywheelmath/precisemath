<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { getGroupedSkills, type Category } from '@/lib/skills/registry';

const categories: Category[] = getGroupedSkills();
</script>

<template>
    <div class="home-container">
        <div class="categories-container">
            <div
                    v-for="category in categories"
                    :key="category.name"
                    class="category-column"
                    >
                    <h2 class="category-title">{{ category.name }}</h2>
                    <nav class="skill-nav">
                        <RouterLink 
                         v-for="skill in category.skills"
                         :key="skill.path"
                         :to="`/session/${skill.path}`"
                         class="skill-link"
                         >
                         {{ skill.displayName }}
                        </RouterLink>
                    </nav>
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-container {
    max-width: 1200px;
    margin: 0.5rem auto;
    padding: 0 1.5rem;
    text-align: center;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: var(--color-ui-text-primary);
}

.categories-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    gap: 1.5rem;
    align-items: flex-start;
}

.category-column{
    flex: 1;
    min-width: 250px;
    max-width: 250px;
}

.category-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--color-ui-primary);
}

.skill-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.skill-link {
    display: block;
    padding: 1rem 2rem;
    font-size: 1.5rem;
    text-decoration: none;
    background-color: var(--color-ui-primary);
    color: var(--color-ui-text-inverse);
    border-radius: 8px;
    transition: background-color 0.2s;
}

.skill-link:hover {
    background-color: var(--color-ui-primary-hover);
}
</style>
