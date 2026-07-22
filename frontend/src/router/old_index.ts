import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@schoolpanel/auth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { 
            path: '/',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
            meta: { title: 'AnteMath' },
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
        },
        {
            path: '/signup',
            name: 'signup',
            component: () => import('../views/SignupView.vue'),
        },
        {
            path: '/password-reset',
            name: 'password-reset-request',
            component: () => import('../views/PasswordResetRequestView.vue'),
        },
        {
            path: '/password-reset/confirm/:uid/:token',
            name: 'password-reset-confirm',
            component: () => import('../views/PasswordResetConfirmView.vue'),
            props: true,
        },
        {   path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue'),
            meta: { requiresAuth: true },
        },
        {   path: '/profile/:categorySlug/:skillSlug',
            name: 'profile-skill-detail',
            component: () => import('../views/ProfileSkillDetailView.vue'),
            props: true,
            meta: { requiresAuth: true },
        },
        {
            path: '/student-profile',
            name: 'teacher-student-profiles',
            component: () => import('@/views/TeacherStudentProfileView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/session/:categorySlug/:skillSlug',
            name: 'session',
            component: () => import('../views/SessionView.vue'),
            props: true,
        },
    ]
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
        await authStore.init();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' });
    } else {
        next();
    }
});

export default router;
