<template>
    <Dialog v-model:visible="catalogueDialogVisible" header="Add from Catalogue" modal style="width: 720px">
        <div class="catalogue-body">
            <label class="swift-search">
                <span class="ico">⌕</span>
                <input
                    v-model="catalogueSearch"
                    placeholder="Search catalogue..."
                    class="swift-input"
                    @input="onCatalogueSearch"
                />
            </label>

            <div class="catalogue-list">
                <table v-if="catalogueItems.length > 0" class="swift-table">
                    <thead>
                        <tr>
                            <th class="col-sku">SKU</th>
                            <th>Title</th>
                            <th class="col-currency">Price</th>
                            <th class="col-type">Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="row in catalogueItems"
                            :key="row.id"
                            class="catalogue-row"
                            @click="onCatalogueRowClick({ data: row })"
                        >
                            <td class="col-sku col-id">{{ row.sku }}</td>
                            <td>{{ row.title }}</td>
                            <td class="col-currency">{{ formatCataloguePrice(row.price) }}</td>
                            <td class="col-type">
                                <Tag :kind="row.type === 'PRODUCT' ? 'info' : undefined">{{ row.type }}</Tag>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else-if="catalogueLoading" class="empty-state">Loading…</div>
                <div v-else class="empty-state">No items found.</div>
            </div>

            <p class="hint">Click a row to add it to the section.</p>
        </div>
        <template #footer>
            <Btn variant="default" @click="catalogueDialogVisible = false">Close</Btn>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';
import Dialog from 'primevue/dialog';

import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';

const catalogueDialogVisible = inject<Ref<boolean>>('catalogueDialogVisible')!;
const catalogueItems = inject<Ref<any[]>>('catalogueItems')!;
const catalogueLoading = inject<Ref<boolean>>('catalogueLoading')!;
const catalogueSearch = inject<Ref<string>>('catalogueSearch')!;

const onCatalogueSearch = inject<() => void>('onCatalogueSearch')!;
const onCatalogueRowClick = inject<(event: { data: any }) => void>('onCatalogueRowClick')!;
const formatCataloguePrice = inject<(value: number) => string>('formatCataloguePrice')!;
</script>

<style scoped>
.catalogue-body {
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    padding-top: var(--s-2);
}

.catalogue-list {
    max-height: 50vh;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
}

.catalogue-row { cursor: pointer; }

.col-sku { width: 110px; }
.col-type { width: 90px; }

.empty-state {
    padding: var(--s-7);
    text-align: center;
    color: var(--text-3);
}

.hint {
    font-size: var(--fs-sm);
    color: var(--text-3);
}
</style>
