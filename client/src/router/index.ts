import { createRouter, createWebHistory } from 'vue-router'

import ProposalList from './ProposalList.vue'
import ProposalEditor from './ProposalEditor.vue'
import PageNotFound from './PageNotFound.vue'

const routes = [
    { path: '/', component: ProposalList },
    { path: '/proposals/:id', component: ProposalEditor },
    { path: '/:pathMatch(.*)*', component: PageNotFound }
]
  
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;