
const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';

/**
 * Gets All Proposals
 * @param id 
 * @returns 
 */
export async function GetProposals() {
    try {
        const data = await fetch(`${domain}/api/v1/proposal/`);
        const body = data.json();
        return body;
    } 
    
    catch (error) {
        console.error(`There was an error with 'GetProposals'.`)
        console.error(error);
        return null;
    }
}

/**
 * Gets Proposal data by id
 * @param id 
 * @returns 
 */
export async function GetProposalById(id: string) {
    try {
        const data = await fetch(`${domain}/api/v1/proposal/${id}`);
        const body = data.json();
        return body;
    } 
    
    catch (error) {
        console.error(`There was an error with 'GetProposalById'.`)
        console.error(error);
        return null;
    }
}

/**
 * Creates Proposal data via POST
 * @param proposalTemplate The proposal template that will be used to create the new proposal
 * @returns The new proposal or null on error
 */
export async function CreateNewProposal(proposalTemplate: string = 'default') {
    try {
        const response = await fetch(`${domain}/api/v1/proposal/${proposalTemplate}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Failed to create proposal. Status: ${response.status}`);
            return null;
        }

        const newProposal = await response.json();
        return newProposal;
    } 
    
    catch (error) {
        console.error(`There was an error with 'CreateNewProposal'.`);
        console.error(error);
        return null;
    }
}

/**
 * Saves Proposal data via PUT
 * @param proposal The proposal data to be saved
 * @returns The saved proposal or null on error
 */
export async function SaveProposal(proposal: any) {
    try {
        const response = await fetch(`${domain}/api/v1/proposal/${proposal.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payload: proposal
            }),
        });

        if (!response.ok) {
            console.error(`Failed to save proposal. Status: ${response.status}`);
            return null;
        }

        const savedProposal = await response.json();
        return savedProposal;
    } catch (error) {
        console.error(`There was an error with 'SaveProposal'.`);
        console.error(error);
        return null;
    }
}
