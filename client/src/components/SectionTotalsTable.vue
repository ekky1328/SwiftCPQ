<template>
    <div class="flex flex-col gap-3 cursor-auto">

        <div v-if="Object.keys(sectionsByRecurrance).length === 0"
             class="p-12 text-center text-gray-400">
            No product sections in this proposal.
        </div>

        <!-- Recurrance group cards -->
        <div
            v-for="(sections, recurrance) in sectionsByRecurrance"
            :key="recurrance"
            class="border border-gray-300 overflow-hidden rounded"
        >
            <!-- Group header -->
            <div class="px-4 py-2.5 bg-gray-100 border-b border-gray-300 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-800">
                        {{ formatRecurrance(recurrance as string) }}
                    </span>
                    <span class="text-xs text-gray-500">· {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}</span>
                </div>
                <span class="text-sm font-bold text-gray-900 tabular-nums">
                    {{ formatCurrency(totals[recurrance as string]?.total ?? 0) }}
                </span>
            </div>

            <!-- Section rows -->
            <div
                v-for="sec in sections"
                :key="sec.id"
                class="flex items-center gap-4 pl-7 pr-4 py-2.5 border-b border-gray-300 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
                <!-- Title + detail stacked -->
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-700 truncate">
                            {{ sec.title || 'Untitled Section' }}
                        </span>
                        <span v-if="sec.isOptional" class="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5 shrink-0">Optional</span>
                        <span v-if="sec.isReference" class="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5 shrink-0">Reference</span>
                    </div>
                    <span class="flex items-center gap-1.5 text-xs text-gray-500">
                        Cost <span class="text-gray-700">{{ formatCurrency(sec._totals?.cost ?? 0) }}</span>
                        &nbsp;·&nbsp;
                        Margin <span class="text-gray-700">{{ formatCurrency(sec._totals?.margin ?? 0) }}</span>
                        <span
                            v-if="marginPercent(sec) !== null"
                            class="font-medium px-1.5 py-0.5 rounded"
                            :class="marginPercentClass(sec)"
                        >{{ marginPercent(sec) }}%</span>
                    </span>
                </div>
                <!-- Total -->
                <span class="text-sm font-medium text-gray-700 w-24 text-right tabular-nums shrink-0">
                    {{ formatCurrency(sec._totals?.total ?? 0) }}
                </span>
            </div>
        </div>

        <!-- Grand total -->
        <div
            v-if="Object.keys(sectionsByRecurrance).length > 1"
            class="flex items-center justify-between px-4 py-2.5 bg-gray-200 border border-gray-300 rounded"
        >
            <div class="flex flex-col gap-0.5">
                <span class="text-sm font-bold text-gray-900">Grand Total</span>
                <span class="text-xs text-gray-600">
                    Cost {{ formatCurrency(grandTotals.cost) }} · Margin {{ formatCurrency(grandTotals.margin) }}
                </span>
            </div>
            <span class="text-sm font-bold text-gray-900 tabular-nums">
                {{ formatCurrency(grandTotals.total) }}
            </span>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProposalStore } from '../store/proposalStore';
import { SECTION_TYPES } from '../constants/sections';
import type { Section } from '../types/Proposal';

defineProps<{ section: Section }>();

const proposalStore = useProposalStore();

const RECURRANCE_LABELS: Record<string, string> = {
    ONE_TIME: 'One Time',
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
    ANNUAL: 'Annual',
};

const totals = computed(() => proposalStore.data?._totals ?? {});

const sectionsByRecurrance = computed(() => {
    const sections = proposalStore.data?.sections ?? [];
    const groups: Record<string, Section[]> = {};
    for (const sec of sections) {
        if (sec.type === SECTION_TYPES.PRODUCTS && sec.recurrance) {
            if (!groups[sec.recurrance]) groups[sec.recurrance] = [];
            groups[sec.recurrance].push(sec);
        }
    }
    return groups;
});

const grandTotals = computed(() =>
    Object.values(totals.value).reduce(
        (acc, val) => {
            acc.cost += val.cost;
            acc.margin += val.margin;
            acc.total += val.total;
            return acc;
        },
        { cost: 0, margin: 0, total: 0 }
    )
);

function formatCurrency(value: number) {
    return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatRecurrance(key: string) {
    return RECURRANCE_LABELS[key] ?? key;
}

function marginPercent(sec: Section): number | null {
    const total = sec._totals?.total ?? 0;
    const margin = sec._totals?.margin ?? 0;
    if (total === 0) return null;
    return Math.round((margin / total) * 100);
}

function marginPercentClass(sec: Section) {
    const pct = marginPercent(sec);
    if (pct === null) return '';
    if (pct >= 30) return 'bg-green-100 text-green-700';
    if (pct >= 15) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}
</script>
