import { CoreSettings } from "../types/System";
import { Proposal } from "../types/Proposal";

export interface ProposalPayload extends Proposal, CoreSettings {}

/**
 * Strips the properties from a `ProposalPayload` object that are defined in `CoreSettings`.
 * This function iterates over the keys of the `proposal` object and removes any key that exists in the `CoreSettings` type.
 * Which is merged together to serve the 'EditorUI'
 *
 * @param proposal - The `ProposalPayload` object from which properties should be removed.
 * @returns The modified `ProposalPayload` object with the specified properties removed.
 */
export function stripBackToProposal(proposal: ProposalPayload): Proposal {

    const keysToRemove = [
        "prefix",
        "suffix",
        "logo",
        "currency",
        "timezone",
        "dateFormat",
        "contactInformationDefaults",
        "proposalSettingsDefaults",
        "theme"
    ] as string[]

    Object.keys(proposal).forEach(key => {
        if (keysToRemove.includes(key as string)) {
            delete (proposal as any)[key];
        }
    });

    return proposal;
};