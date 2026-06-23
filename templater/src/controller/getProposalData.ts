export async function getProposalData(id: string, tenantId?: string, renderToken?: string) {
  const mainServerUrl = process.env.MAIN_SERVER_URL || 'http://localhost:5000';

  if (renderToken) {
    const response = await fetch(`${mainServerUrl}/api/v1/render/proposal/${id}`, {
      headers: { 'x-render-token': renderToken },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch proposal for render: ${response.status}`);
    }

    return await response.json();
  }

  // Fallback: legacy service-token path (used when no render token is provided)
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (!serviceToken) {
    throw new Error('INTERNAL_SERVICE_TOKEN is not set');
  }

  const params = new URLSearchParams({ coreSettings: 'true' });
  if (tenantId) params.set('tenantId', tenantId);

  const response = await fetch(`${mainServerUrl}/api/v1/proposal/${id}?${params}`, {
    headers: { 'x-service-token': serviceToken },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch proposal: ${response.status}`);
  }

  return await response.json();
}
