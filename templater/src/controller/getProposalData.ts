/**
 * Get Proposal Data from the SwiftCPQ Server
 * @param id
 * @returns
 */
export async function getProposalData(id: string, tenantId?: string) {
  try {
    const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:5000';
    const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!serviceToken) {
      throw new Error('INTERNAL_SERVICE_TOKEN is not set');
    }

    const params = new URLSearchParams({ coreSettings: 'true' });
    if (tenantId) params.set('tenantId', tenantId);

    const response = await fetch(`${mainServerUrl}/api/v1/proposal/${id}?${params}`, {
      headers: {
        'x-service-token': serviceToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch proposal: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
}
