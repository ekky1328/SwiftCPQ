/**
 * Get Proposal Data from the SwiftCPQ Server
 * @param id 
 * @returns 
 */
export async function getProposalData(id: string) {
  try {
    
    const response = await fetch(`http://localhost:5000/api/v1/proposal/${id}?coreSettings=true`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data;
  } 
  
  catch (error) {
    console.error(error)
  }
}