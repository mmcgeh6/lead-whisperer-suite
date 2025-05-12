/**
 * Apollo.io API Service
 * Handles integration with the Apollo.io API for lead generation via n8n webhook
 */

// Helper function to format search parameters for Apollo.io API
export const formatApolloSearchUrl = (params: {
  personTitles?: string[];
  location?: string;
  organizationLocations?: string[];
  seniorities?: string[];
  emailStatus?: string[];
  employeeRanges?: string[];
  keywords?: string[];
  limit?: number;
}): string => {
  let searchUrl = 'https://api.apollo.io/api/v1/mixed_people/search?';
  
  // Add person titles if available (replacing spaces with underscores for Apollo API)
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      const formattedTitle = title.replace(/ /g, '_');
      searchUrl += `person_titles[]=${encodeURIComponent(formattedTitle)}&`;
    });
  }
  
  // Add person location if available
  if (params.location) {
    searchUrl += `person_locations[]=${encodeURIComponent(params.location)}&`;
  }
  
  // Add organization locations if available
  if (params.organizationLocations && params.organizationLocations.length > 0) {
    params.organizationLocations.forEach(location => {
      searchUrl += `organization_locations[]=${encodeURIComponent(location)}&`;
    });
  }
  
  // Add seniorities if available
  if (params.seniorities && params.seniorities.length > 0) {
    params.seniorities.forEach(seniority => {
      searchUrl += `person_seniorities[]=${encodeURIComponent(seniority)}&`;
    });
  }
  
  // Add email status if available
  if (params.emailStatus && params.emailStatus.length > 0) {
    params.emailStatus.forEach(status => {
      searchUrl += `contact_email_status[]=${encodeURIComponent(status)}&`;
    });
  }
  
  // Add employee ranges if available
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    params.employeeRanges.forEach(range => {
      searchUrl += `organization_num_employees_ranges[]=${encodeURIComponent(range)}&`;
    });
  }

  // Add keywords (using q_keywords for Apollo's API)
  if (params.keywords && params.keywords.length > 0) {
    const keywordsString = params.keywords.join(" ");
    searchUrl += `q_keywords=${encodeURIComponent(keywordsString)}&`;
  }
  
  // Add page and per_page parameters
  searchUrl += `page=1&per_page=${params.limit || 20}`;
  
  return searchUrl;
};

// Function to make authenticated requests to Apollo.io API via n8n webhook
export const apolloApiRequest = async (url: string, apiKey: string): Promise<any> => {
  try {
    console.log("Making Apollo API request via n8n webhook");
    
    // The n8n webhook URL
    const webhookUrl = "https://n8n-service-el78.onrender.com/webhook-test/c12e03c0-2618-4506-ab7d-2ced298ad959";
    
    // Send the Apollo URL to the n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        URL: url,
        apiKey: apiKey
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("n8n webhook request failed:", error);
    throw error;
  }
};

// Interface for Apollo API response
export interface ApolloResponse {
  results: any[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

// Parse Apollo API response into a standardized format
export const parseApolloResponse = (response: any): ApolloResponse => {
  // Check if we have a valid response with contacts
  if (!response || !response.contacts || !Array.isArray(response.contacts)) {
    console.warn("Invalid Apollo.io API response format", response);
    return {
      results: [],
      pagination: { 
        page: 1,
        per_page: 0,
        total_entries: 0,
        total_pages: 1
      }
    };
  }
  
  return {
    results: response.contacts,
    pagination: response.pagination || { 
      page: 1,
      per_page: response.contacts.length,
      total_entries: response.contacts.length,
      total_pages: 1
    }
  };
};
