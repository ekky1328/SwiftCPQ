<template>
    <Editor v-model="section.description" editor-style="max-height: 750px; overflow-y: auto;" class="cursor-auto" />
</template>

<script setup lang="ts">
import Editor from 'primevue/editor';
import type { Section } from '../types/Proposal';

defineProps<{ section: Section }>();
</script>
