import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { GetCatalogueItems } from '../api/api';
import { useProposalStore } from '../store/proposalStore';
import { formatCurrency } from '../utils/helpers';

export function useCataloguePicker() {
    const toast = useToast();
    const proposalStore = useProposalStore();

    const catalogueDialogVisible = ref(false);
    const catalogueItems = ref<CatalogueItem[]>([]);
    const catalogueLoading = ref(false);
    const catalogueSearch = ref('');
    const catalogueTargetSectionId = ref<number | null>(null);
    let catalogueSearchTimer: ReturnType<typeof setTimeout> | null = null;

    function formatCataloguePrice(value: number): string {
        return formatCurrency(value, 'AUD', 'en-AU');
    }

    async function openCataloguePicker(sectionId: number) {
        catalogueTargetSectionId.value = sectionId;
        catalogueSearch.value = '';
        catalogueDialogVisible.value = true;
        catalogueLoading.value = true;
        try {
            catalogueItems.value = (await GetCatalogueItems()) ?? [];
        } finally {
            catalogueLoading.value = false;
        }
    }

    function onCatalogueSearch() {
        if (catalogueSearchTimer) clearTimeout(catalogueSearchTimer);
        catalogueSearchTimer = setTimeout(async () => {
            catalogueLoading.value = true;
            try {
                catalogueItems.value = (await GetCatalogueItems(catalogueSearch.value)) ?? [];
            } finally {
                catalogueLoading.value = false;
            }
        }, 300);
    }

    function onCatalogueRowClick(event: { data: CatalogueItem }) {
        if (catalogueTargetSectionId.value === null) return;
        proposalStore.addCatalogueItemToSection(catalogueTargetSectionId.value, event.data);
        toast.add({ severity: 'success', summary: 'Added', detail: `"${event.data.title}" added to section`, life: 3000 });
        catalogueDialogVisible.value = false;
    }

    return {
        catalogueDialogVisible,
        catalogueItems,
        catalogueLoading,
        catalogueSearch,
        openCataloguePicker,
        onCatalogueSearch,
        onCatalogueRowClick,
        formatCataloguePrice,
    };
}
