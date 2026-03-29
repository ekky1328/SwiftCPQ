import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/authStore';

import Login from './Login.vue'
import ProposalList from './ProposalList.vue'
import ProposalEditor from './ProposalEditor.vue'
import Catalogue from './Catalogue.vue'
import PageNotFound from './PageNotFound.vue'

const routes = [
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/change-password', component: () => import('./ChangePassword.vue') },
    { path: '/', component: ProposalList },
    { path: '/proposals/:id', component: ProposalEditor },
    { path: '/catalogue', component: Catalogue },
    { path: '/customers', component: () => import('./Customers.vue') },
    { path: '/suppliers', component: () => import('./Suppliers.vue') },
    { path: '/users', component: () => import('./Users.vue') },
    { path: '/roles', component: () => import('./Roles.vue') },
    { path: '/settings', component: () => import('./Settings.vue') },
    { path: '/admin/tenants', component: () => import('./admin/TenantList.vue'), meta: { superAdmin: true } },
    { path: '/admin/tenants/new', component: () => import('./admin/TenantCreate.vue'), meta: { superAdmin: true } },
    { path: '/admin/tenants/:id', component: () => import('./admin/TenantDetail.vue'), meta: { superAdmin: true } },
    { path: '/:pathMatch(.*)*', component: PageNotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.public) return true;
  const auth = useAuthStore();
  if (!auth.user) return { path: '/login' };
  if (auth.user.forcePasswordReset && to.path !== '/change-password') {
    return { path: '/change-password' };
  }
  if (to.meta.superAdmin && !auth.user.isSuperAdmin) return { path: '/' };
});

export default router;
