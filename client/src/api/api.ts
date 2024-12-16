
const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';

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
 * Saves Proposal data via POST
 * @param proposal The proposal data to be saved
 * @returns The saved proposal or null on error
 */
export async function SaveProposal(proposal: any) {
    try {
        const response = await fetch(`${domain}/api/v1/proposal/${proposal.id}`, {
            method: 'POST',
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
