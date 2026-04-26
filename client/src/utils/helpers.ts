import { Proposal } from "../types/Proposal";

/**
 * Formats a number as a localised currency string.
 *
 * @param {number} value - The numeric amount to format
 * @param {string} [currency='USD'] - ISO 4217 currency code
 * @param {string} [locale='en-US'] - BCP 47 locale tag
 * @returns {string} Formatted currency string, e.g. "$1,234.56"
 */
export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function concatProposalIdentifier(proposal: Proposal) {
    let identifiers = [];
    
    identifiers.push(proposal.prefix);
    identifiers.push(proposal.identifier);
    identifiers.push(proposal.suffix);
  
    return identifiers.filter(f => f).join('-');
}