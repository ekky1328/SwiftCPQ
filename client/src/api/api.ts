
const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${domain}${input}`, {
        ...init,
        credentials: 'include',
    });

    if (res.status === 401) {
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized'));
    }

    return res;
}

/**
 * Gets All Proposals
 */
export async function GetProposals() {
    try {
        const data = await apiFetch('/api/v1/proposal/');
        return data.json();
    } catch (error) {
        console.error(`There was an error with 'GetProposals'.`);
        console.error(error);
        return null;
    }
}

/**
 * Gets Proposal data by id
 */
export async function GetProposalById(id: string) {
    try {
        const data = await apiFetch(`/api/v1/proposal/${id}?coreSettings=true`);
        if (data.status === 500) {
            throw new Error(await data.text());
        }
        return data.json();
    } catch (error) {
        console.error(`There was an error with 'GetProposalById'.`);
        console.error(error);
        return { error: true, message: `There was an issue getting data for proposal with id '${id}'.` };
    }
}

/**
 * Creates Proposal data via POST
 */
export async function CreateNewProposal(proposalTemplate: string = 'default') {
    try {
        const response = await apiFetch(`/api/v1/proposal/${proposalTemplate}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            console.error(`Failed to create proposal. Status: ${response.status}`);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error(`There was an error with 'CreateNewProposal'.`);
        console.error(error);
        return null;
    }
}

/**
 * Saves Proposal data via PUT
 */
export async function SaveProposal(proposal: any) {
    try {
        const response = await apiFetch(`/api/v1/proposal/${proposal.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: proposal }),
        });

        if (!response.ok) {
            console.error(`Failed to save proposal. Status: ${response.status}`);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error(`There was an error with 'SaveProposal'.`);
        console.error(error);
        return null;
    }
}
