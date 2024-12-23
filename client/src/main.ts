import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';


import Aura from '@primevue/themes/aura';

import './style.css'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.directive('tooltip', Tooltip);

app.use(router);
app.use(ToastService);
app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark'
        }
    },
});

app.mount('#app');