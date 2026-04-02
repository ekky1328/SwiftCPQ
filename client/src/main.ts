import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

import Aura from '@primevue/themes/aura';

import './style.css'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router';
import { useAuthStore } from './store/authStore';

const app = createApp(App);
const pinia = createPinia();

app.directive('tooltip', Tooltip);

app.use(router);
app.use(ToastService);
app.use(ConfirmationService);
app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark'
        }
    },
});

// Initialize auth state before mounting so route guards have user info
const auth = useAuthStore();
auth.initialize().then(() => {
    app.mount('#app');
});
