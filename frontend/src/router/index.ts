import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useIdentityStore } from '@/stores/identity';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@/views/DashboardView.vue'),
    },
    {
        path: '/signin',
        name: 'signin',
        component: () => import('@/views/auth/SignInView.vue'),
        meta: { requiresGuest: true },
    },
    {
        path: '/password-reset',
        name: 'password-reset',
        component: () => import('@/views/auth/ChangePasswordView.vue'),
        meta: { requiresIdentity: true },
    },
    {
        path: '/delete',
        name: 'delete',
        component: () => import('@/views/auth/DeleteAccountView.vue'),
        meta: { requiresIdentity: true },
    },
    {
        path: '/session',
        name: 'session',
        component: () => import('@/views/engine/SessionView.vue'),
    },
    {
        path: '/session/:category_slug/:skill_slug',
        name: 'session-arena',
//        component: () => import('@features/session-engine/views/ArenaView.vue'),
        meta: { requiresIdentity: true },
    },
    {
        path: '/dashboard',
        name: 'performance-dashboard',
//        component: () => import('@/features/analytics/views/DashboardView.vue'),
        meta: { requiresAuth: true },
    },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
    const identityStore = useIdentityStore();

    if (to.meta.requiresAuth && !identityStore.isAuthenticated) return next({ name: 'login' });

    if (to.meta.requiresIdentity) {
        if (!identityStore.isAuthenticated && !identityStore.hasGuestAccess) {
            const fallbackUuid = crypto.randomUUID();
            identityStore.setGuestToken(fallbackUuid);
        }
        return next();
    }
    if (to.meta.requiresGuest && identityStore.isAuthenticated) return next({ name: 'performance-dashboard' });

    next();
})

export default router
