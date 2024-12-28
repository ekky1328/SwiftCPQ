
<template>
  <div v-if="IS_DEV_BUILD" class="py-2 text-center bg-black text-yellow-200 border-b-4 border-yellow-200">
    🚧 Beware you are viewing a development build (v0.0.1-alpha); there will be bugs. 🚧
  </div>
  <main>
    <nav class="bg-white border-r border-r-gray-300">
      <div class="grid place-content-center h-[75px] cursor-default" v-tooltip="'⚡ SwiftCPQ'">
        ⚡
      </div>
      <div>
        <router-link to="/" v-tooltip="'Home'">
          <span class="pi pi-home" title="Home"></span>
        </router-link>
        <router-link to="/catalogue" disabled v-tooltip="'Catalogue'">
          <span class="pi pi-database" title="Catalogue"></span>
        </router-link>
      </div>
    </nav>
    <div>
      <RouterView />
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';

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
  }

  nav a {
    display: grid;
    place-content: center;
    height: 49px !important;
    width: 49px !important;
  }

  nav a:hover {
    background-color: #cdcdcd;
  }
</style>

<style>
html, body {
  min-height: 100vh;
  background-color: #ebeef0;
}
</style>
