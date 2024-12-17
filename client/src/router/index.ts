import { createRouter, createWebHistory } from 'vue-router'

import ProposalList from './ProposalList.vue'
import ProposalEditor from './ProposalEditor.vue'

const routes = [
    { path: '/', component: ProposalList },
    { path: '/proposals/:id', component: ProposalEditor },
  ]
  
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;