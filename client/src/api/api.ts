
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

// ─── Customers ───────────────────────────────────────────────────────────────

export async function GetCustomers() {
    try {
        const res = await apiFetch('/api/v1/customer/');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetCustomers error:', error);
        return null;
    }
}

export async function GetCustomerById(id: string) {
    try {
        const res = await apiFetch(`/api/v1/customer/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetCustomerById error:', error);
        return null;
    }
}

export async function CreateCustomer(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/customer/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateCustomer error:', error);
        return null;
    }
}

export async function UpdateCustomer(id: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/customer/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateCustomer error:', error);
        return null;
    }
}

export async function DeleteCustomer(id: string) {
    try {
        const res = await apiFetch(`/api/v1/customer/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteCustomer error:', error);
        return false;
    }
}

export async function CreateCustomerContact(customerId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateCustomerContact error:', error);
        return null;
    }
}

export async function UpdateCustomerContact(customerId: string, contactId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/contact/${contactId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateCustomerContact error:', error);
        return null;
    }
}

export async function DeleteCustomerContact(customerId: string, contactId: string) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/contact/${contactId}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteCustomerContact error:', error);
        return false;
    }
}

export async function CreateCustomerLocation(customerId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateCustomerLocation error:', error);
        return null;
    }
}

export async function UpdateCustomerLocation(customerId: string, locationId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/location/${locationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateCustomerLocation error:', error);
        return null;
    }
}

export async function DeleteCustomerLocation(customerId: string, locationId: string) {
    try {
        const res = await apiFetch(`/api/v1/customer/${customerId}/location/${locationId}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteCustomerLocation error:', error);
        return false;
    }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function GetUsers() {
    try {
        const res = await apiFetch('/api/v1/user/');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetUsers error:', error);
        return null;
    }
}

export async function CreateUser(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/user/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateUser error:', error);
        return null;
    }
}

export async function UpdateUser(id: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/user/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateUser error:', error);
        return null;
    }
}

export async function DeleteUser(id: string) {
    try {
        const res = await apiFetch(`/api/v1/user/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteUser error:', error);
        return false;
    }
}

// ─── Roles & Permissions ─────────────────────────────────────────────────────

export async function GetRoles() {
    try {
        const res = await apiFetch('/api/v1/role/');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetRoles error:', error);
        return null;
    }
}

export async function GetRoleById(id: string) {
    try {
        const res = await apiFetch(`/api/v1/role/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetRoleById error:', error);
        return null;
    }
}

export async function CreateRole(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/role/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateRole error:', error);
        return null;
    }
}

export async function UpdateRole(id: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/role/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateRole error:', error);
        return null;
    }
}

export async function DeleteRole(id: string) {
    try {
        const res = await apiFetch(`/api/v1/role/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteRole error:', error);
        return false;
    }
}

export async function GetAllPermissions() {
    try {
        const res = await apiFetch('/api/v1/role/permissions/all');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetAllPermissions error:', error);
        return null;
    }
}

export async function AssignPermissionToRole(roleId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/role/${roleId}/permission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('AssignPermissionToRole error:', error);
        return null;
    }
}

export async function RemovePermissionFromRole(roleId: string, assignmentId: string) {
    try {
        const res = await apiFetch(`/api/v1/role/${roleId}/permission/${assignmentId}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('RemovePermissionFromRole error:', error);
        return false;
    }
}

export async function AssignUserToRole(roleId: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/role/${roleId}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('AssignUserToRole error:', error);
        return null;
    }
}

export async function RemoveUserFromRole(roleId: string, assignmentId: string) {
    try {
        const res = await apiFetch(`/api/v1/role/${roleId}/user/${assignmentId}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('RemoveUserFromRole error:', error);
        return false;
    }
}

// ─── System Settings ──────────────────────────────────────────────────────────

export async function GetSystemSettings() {
    try {
        const res = await apiFetch('/api/v1/system/settings');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetSystemSettings error:', error);
        return null;
    }
}

export async function UpdateSystemSettings(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/system/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateSystemSettings error:', error);
        return null;
    }
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function GetSuppliers() {
    try {
        const res = await apiFetch('/api/v1/supplier/');
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetSuppliers error:', error);
        return null;
    }
}

export async function CreateSupplier(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/supplier/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateSupplier error:', error);
        return null;
    }
}

export async function UpdateSupplier(id: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/supplier/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateSupplier error:', error);
        return null;
    }
}

export async function DeleteSupplier(id: string) {
    try {
        const res = await apiFetch(`/api/v1/supplier/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteSupplier error:', error);
        return false;
    }
}

export async function GetImportTemplates(supplierId?: string) {
    try {
        const url = supplierId
            ? `/api/v1/import-template/?supplierId=${supplierId}`
            : '/api/v1/import-template/';
        const res = await apiFetch(url);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetImportTemplates error:', error);
        return null;
    }
}

export async function CreateImportTemplate(data: Record<string, unknown>) {
    try {
        const res = await apiFetch('/api/v1/import-template/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('CreateImportTemplate error:', error);
        return null;
    }
}

export async function UpdateImportTemplate(id: string, data: Record<string, unknown>) {
    try {
        const res = await apiFetch(`/api/v1/import-template/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('UpdateImportTemplate error:', error);
        return null;
    }
}

export async function DeleteImportTemplate(id: string) {
    try {
        const res = await apiFetch(`/api/v1/import-template/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (error) {
        console.error('DeleteImportTemplate error:', error);
        return false;
    }
}

export async function TriggerIngestion(supplierId: string, csvBuffer: ArrayBuffer) {
    try {
        const res = await apiFetch(`/api/v1/ingestion/${supplierId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/csv' },
            body: csvBuffer,
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('TriggerIngestion error:', error);
        return null;
    }
}

export async function GetIngestionJobStatus(jobId: string) {
    try {
        const res = await apiFetch(`/api/v1/ingestion/${jobId}/status`);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('GetIngestionJobStatus error:', error);
        return null;
    }
}
