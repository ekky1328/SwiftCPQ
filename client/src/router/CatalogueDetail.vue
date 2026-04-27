<template>
  <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center" v-if="loading">
    <div class="swift-empty">Loading...</div>
  </div>
  <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center" v-else-if="!item">
    <div class="swift-empty">Item not found.</div>
  </div>
  <CatalogueItemView v-else-if="item.type !== 'BUNDLE'" :item="item" @saved="onSaved" />
  <CatalogueBundleView v-else :item="item" @saved="onSaved" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { GetCatalogueItem } from '../api/api';
import CatalogueItemView from '../components/CatalogueItemView.vue';
import CatalogueBundleView from '../components/CatalogueBundleView.vue';

const route = useRoute();
const item = ref<CatalogueItem | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  item.value = await GetCatalogueItem(route.params.id as string);
  loading.value = false;
}

function onSaved(updated: CatalogueItem) {
  item.value = updated;
}

onMounted(load);
</script>
