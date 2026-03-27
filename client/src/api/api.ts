
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

// ─── Catalogue ───────────────────────────────────────────────────────────────

export async function GetCatalogueItems(search?: string) {
    try {
        const url = search?.trim()
            ? `/api/v1/catalogue/?search=${encodeURIComponent(search)}`
            : '/api/v1/catalogue/';
        const data = await apiFetch(url);
        return data.json();
    } catch (error) {
        console.error(`There was an error with 'GetCatalogueItems'.`);
        console.error(error);
        return null;
    }
}

export async function CreateCatalogueItem(item: Record<string, unknown>) {
    try {
        const response = await apiFetch('/api/v1/catalogue/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.error(`There was an error with 'CreateCatalogueItem'.`);
        console.error(error);
        return null;
    }
}

export async function UpdateCatalogueItem(id: string, item: Record<string, unknown>) {
    try {
        const response = await apiFetch(`/api/v1/catalogue/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.error(`There was an error with 'UpdateCatalogueItem'.`);
        console.error(error);
        return null;
    }
}

export async function DeleteCatalogueItem(id: string) {
    try {
        const response = await apiFetch(`/api/v1/catalogue/${id}`, { method: 'DELETE' });
        if (!response.ok) return false;
        return true;
    } catch (error) {
        console.error(`There was an error with 'DeleteCatalogueItem'.`);
        console.error(error);
        return false;
    }
}

// ─── Proposals ───────────────────────────────────────────────────────────────

/**
 * Gets the full snapshot for a single version, transformed to API format.
 */
export async function GetProposalVersion(proposalId: string, versionId: string) {
    try {
        const data = await apiFetch(`/api/v1/proposal/${proposalId}/versions/${versionId}`);
        return data.json();
    } catch (error) {
        console.error(`There was an error with 'GetProposalVersion'.`);
        console.error(error);
        return null;
    }
}

/**
 * Gets the version history list for a proposal (metadata only, no snapshots).
 */
export async function GetProposalVersions(proposalId: string) {
    try {
        const data = await apiFetch(`/api/v1/proposal/${proposalId}/versions`);
        return data.json();
    } catch (error) {
        console.error(`There was an error with 'GetProposalVersions'.`);
        console.error(error);
        return null;
    }
}

/**
 * Reverts a proposal to a previously saved version.
 */
export async function RevertProposalVersion(proposalId: string, versionId: string) {
    try {
        const response = await apiFetch(`/api/v1/proposal/${proposalId}/revert/${versionId}`, {
            method: 'POST',
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.error(`There was an error with 'RevertProposalVersion'.`);
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
