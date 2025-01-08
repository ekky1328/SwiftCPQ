import { Proposal } from "../types/Proposal";

export function concatProposalIdentifier(proposal: Proposal) {
    let identifiers = [];
    
    identifiers.push(proposal.prefix);
    identifiers.push(proposal.identifier);
    identifiers.push(proposal.suffix);
  
    return identifiers.filter(f => f).join('-');
}