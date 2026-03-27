
<template>
  <div v-if="IS_DEV_BUILD" class="py-2 text-center bg-black text-yellow-200 border-b-4 border-yellow-200">
    🚧 Beware you are viewing a development build (v0.0.1-alpha); there will be bugs. 🚧
  </div>
  <main>
    <nav v-if="auth.user" class="bg-white border-r border-r-gray-300 z-50">
      <div class="grid place-content-center h-[75px] cursor-default" v-tooltip="'⚡ SwiftCPQ'">
        ⚡
      </div>
      <div class="nav-links">
        <router-link to="/" v-tooltip="'Home'">
          <span class="pi pi-home" title="Home"></span>
        </router-link>
        <router-link to="/catalogue" v-tooltip="'Catalogue'">
          <span class="pi pi-database" title="Catalogue"></span>
        </router-link>
      </div>
      <div class="nav-footer">
        <button
          v-tooltip="`${auth.user.firstName} ${auth.user.lastName} — Sign out`"
          class="nav-user-btn"
          @click="auth.logout()"
        >
          <span class="pi pi-user"></span>
        </button>
      </div>
    </nav>
    <div class="z-25">
      <RouterView />
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useAuthStore } from './store/authStore';

const auth = useAuthStore();

let IS_DEV_BUILD = false;
if (import.meta.env) {
  IS_DEV_BUILD = !!import.meta.env.VITE_IS_DEV_BUILD;
}
</script>

<style scoped>
  main {
    display: grid;
    grid-template-columns: 50px 1fr;
    grid-template-rows: 1fr;
    gap: 8px;
    min-height: 100vh;
  }

  nav {
    position: sticky;
    left: 0;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .nav-links {
    flex: 1;
  }

  .nav-footer {
    padding-bottom: 8px;
  }

  nav a, .nav-user-btn {
    display: grid;
    place-content: center;
    height: 49px !important;
    width: 49px !important;
  }

  nav a:hover, .nav-user-btn:hover {
    background-color: #cdcdcd;
  }

  .nav-user-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    width: 100%;
  }
</style>

<style>
html, body {
  min-height: 100vh;
  background-color: #ebeef0;
}

#app .p-editor .ql-toolbar,
#app .p-editor .ql-container {
  border: 1px solid #d1d5db;
}
#app .product-comment .p-editor .ql-toolbar,
#app .product-comment .p-editor .ql-container {
  border: 0px solid #636363;
}

#app .p-editor .ql-toolbar {
  border-bottom: 0;
}
</style>
