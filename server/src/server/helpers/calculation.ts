import { Item } from "../../types/Proposal";
import { Section } from "../../types/Proposal";
import { Proposal } from "../../types/Proposal";

/**
 * Calculate the totals for each section in the proposal.
 * 
 * @param proposal 
 * @returns 
 */
export function calculateProposalTotals(proposal: Proposal) {

    const scaleFactor = 1000;
    const totals: Record<string, { total: number; margin: number; cost: number }> = {};

    delete proposal._section_totals;
    proposal.sections.forEach((section: Section) => {
        if (!section.isOptional && !section.isReference && section.recurrance) {
            if (!totals[section.recurrance]) {
                totals[section.recurrance] = { total: 0, margin: 0, cost: 0 };
            }

            const sectionTotals = section.items?.reduce(
                (acc: { total: number, margin: number, cost: number }, item: Item) => {
                    if (!item.isOptional) {
                        acc.total += Math.round(item.subtotal * scaleFactor);
                        acc.margin += Math.round(item.margin * scaleFactor);
                        acc.cost += Math.round(item.qty * (item.cost * scaleFactor));
                    }
                    return acc;
                },
                { total: 0, margin: 0, cost: 0 }
            ) || { total: 0, margin: 0, cost: 0 };


            delete section._totals;
            section._totals = { total: sectionTotals.total / scaleFactor, margin: sectionTotals.margin / scaleFactor, cost: sectionTotals.cost / scaleFactor };

            if (!proposal._section_totals) {
                proposal._section_totals = {} as Record<string, { title: string, total: number; margin: number; cost: number }[]>;
            }

            if (!proposal._section_totals[section.recurrance]) {
                proposal._section_totals[section.recurrance] = [];
            }

            proposal._section_totals[section.recurrance].push({
                title: section.title,
                ...section._totals
            });

            totals[section.recurrance].total += sectionTotals.total;
            totals[section.recurrance].margin += sectionTotals.margin;
            totals[section.recurrance].cost += sectionTotals.cost;
        }
    });

    delete proposal._totals;
    proposal._totals = Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [key, { total: value.total / scaleFactor, margin: value.margin / scaleFactor, cost: value.cost / scaleFactor }])
    ) as Record<string, { total: number; margin: number; cost: number }>;

    return proposal;
    
}   