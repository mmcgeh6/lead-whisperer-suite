
/**
 * Service to handle interactions with the Apify API for lead searches
 */

/**
 * Search for leads using the Apify Apollo Scraper API
 * @param params Search parameters
 * @returns Search results
 */
export const searchForLeads = async (params: {
  industry: string;
  location?: string;
  limit?: number;
}) => {
  try {
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('apifyApolloApiKey');
    
    if (!apiKey) {
      throw new Error("Apify API key is not configured");
    }
    
    // Default limit if not provided
    const limit = params.limit || 20;
    
    // Default location if not provided
    const location = params.location || "United States";
    
    // Format the search URL for Apollo.io
    const apolloUrl = `https://app.apollo.io/#/people?page=1&existFields[]=organization_id&includedOrganizationKeywordFields[]=tags&includedOrganizationKeywordFields[]=name&includedOrganizationKeywordFields[]=seo_description&organizationLocations[]=${encodeURIComponent(location)}&sortByField=%5Bnone%5D&sortAscending=false&qOrganizationKeywordTags[]=${encodeURIComponent(params.industry)}&personSeniorities[]=director&personDepartmentOrSubdepartments[]=master_marketing&personDepartmentOrSubdepartments[]=master_sales`;
    
    // API endpoint
    const endpoint = `https://api.apify.com/v2/acts/jljBwyyQakqrL1wae/run-sync-get-dataset-items?timeout=300&limit=${limit}`;
    
    console.log("Search URL:", apolloUrl);
    console.log("API endpoint:", endpoint);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        url: apolloUrl
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response error:", errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API response:", data);
    
    return data;
  } catch (error) {
    console.error("Error searching for leads via Apify:", error);
    throw error;
  }
};

/**
 * Transform raw Apify data into a standardized leads format
 */
export const transformApifyResults = (results: any[]) => {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
  return results.map(item => {
    // Extract company data
    const company = {
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.organization_name || "Unknown Company",
      website: item.organization_website || "",
      industry: item.organization_industry || "",
      size: item.organization_size || "",
      location: item.organization_location || "",
      description: item.organization_description || "",
      linkedin_url: item.organization_linkedin_url || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Extract contact data
    const contact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: item.first_name || "",
      lastName: item.last_name || "",
      title: item.title || "",
      email: item.email || "",
      phone: item.phone || "",
      linkedin_url: item.linkedin_url || "",
      companyId: company.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return { company, contact };
  });
};
