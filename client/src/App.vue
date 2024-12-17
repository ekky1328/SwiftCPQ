
<template>
  <main>
    <nav class="bg-white border-r border-r-gray-300">
      <div class="mt-[75px]">
        <router-link to="/">
          <span class="pi pi-home" title="Home"></span>
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
</script>

<style scoped>
  main {
    display: grid;
    grid-template-columns: 50px 1fr;
    grid-template-rows: 1fr;
    gap: 8px;
    min-height: 100vh;
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
