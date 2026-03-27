import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/authStore';

import Login from './Login.vue'
import ProposalList from './ProposalList.vue'
import ProposalEditor from './ProposalEditor.vue'
import PageNotFound from './PageNotFound.vue'

const routes = [
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/', component: ProposalList },
    { path: '/proposals/:id', component: ProposalEditor },
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
});

export default router;
