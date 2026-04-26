<template>
    <div class="totals-summary">

        <div v-if="Object.keys(sectionsByRecurrance).length === 0" class="empty">
            No product sections in this proposal.
        </div>

        <section
            v-for="(sections, recurrance) in sectionsByRecurrance"
            :key="recurrance"
            class="swift-panel recurrance-group"
        >
            <header class="swift-panel__header">
                <span class="group-label">{{ formatRecurrance(recurrance as string) }}</span>
                <span class="group-meta">{{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}</span>
                <span class="spacer"></span>
                <span class="group-total">{{ formatCurrency(totals[recurrance as string]?.total ?? 0) }}</span>
            </header>

            <div
                v-for="sec in sections"
                :key="sec.id"
                class="section-row"
            >
                <div class="section-info">
                    <div class="section-title-row">
                        <span class="section-title">{{ sec.title || 'Untitled Section' }}</span>
                        <Tag v-if="sec.isOptional">Optional</Tag>
                        <Tag v-if="sec.isReference">Reference</Tag>
                    </div>
                    <div class="section-meta">
                        <span>Cost <strong>{{ formatCurrency(sec._totals?.cost ?? 0) }}</strong></span>
                        <span class="dot">·</span>
                        <span>Margin <strong>{{ formatCurrency(sec._totals?.margin ?? 0) }}</strong></span>
                        <Tag v-if="marginPercent(sec) !== null" :kind="marginTone(sec)">{{ marginPercent(sec) }}%</Tag>
                    </div>
                </div>
                <span class="section-total">{{ formatCurrency(sec._totals?.total ?? 0) }}</span>
            </div>
        </section>

        <section
            v-if="Object.keys(sectionsByRecurrance).length > 1"
            class="swift-panel grand-total"
        >
            <div class="grand-info">
                <span class="grand-label">Grand Total</span>
                <span class="grand-meta">
                    Cost {{ formatCurrency(grandTotals.cost) }} · Margin {{ formatCurrency(grandTotals.margin) }}
                </span>
            </div>
            <span class="grand-amount">{{ formatCurrency(grandTotals.total) }}</span>
        </section>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from '../ui/Tag.vue';
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

function marginTone(sec: Section): 'success' | 'warn' | 'error' {
    const pct = marginPercent(sec) ?? 0;
    if (pct >= 30) return 'success';
    if (pct >= 15) return 'warn';
    return 'error';
}
</script>

<style scoped>
.totals-summary {
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
}

.empty {
    padding: var(--s-7);
    text-align: center;
    color: var(--text-3);
}

.recurrance-group .swift-panel__header {
    gap: var(--s-3);
}
.group-label {
    font-weight: 600;
    color: var(--text-1);
    font-size: var(--fs-md);
}
.group-meta {
    font-size: var(--fs-sm);
    color: var(--text-3);
}
.group-total {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--text-1);
}

.section-row {
    display: flex;
    align-items: center;
    gap: var(--s-5);
    padding: var(--s-4) var(--s-5) var(--s-4) var(--s-7);
    border-top: 1px solid var(--border-subtle);
    transition: background 120ms;
}
.section-row:hover { background: var(--surface-100); }

.section-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}
.section-title-row {
    display: flex;
    align-items: center;
    gap: var(--s-3);
}
.section-title {
    color: var(--text-1);
    font-size: var(--fs-md);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.section-meta {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    color: var(--text-3);
    font-size: var(--fs-sm);
}
.section-meta strong {
    color: var(--text-2);
    font-weight: 500;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
}
.section-meta .dot { color: var(--text-4); }
.section-total {
    width: 110px;
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-1);
    font-weight: 500;
    flex-shrink: 0;
}

.grand-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--s-4) var(--s-5);
    background: var(--surface-100);
}
.grand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.grand-label {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--text-1);
}
.grand-meta {
    font-size: var(--fs-sm);
    color: var(--text-3);
}
.grand-amount {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: var(--fs-lg);
    color: var(--text-1);
}
</style>
