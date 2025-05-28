
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
  
  // Add person titles if available (encode properly for URL)
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      searchUrl += `person_titles[]=${encodeURIComponent(title)}&`;
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
    
    // First, let's try to check if the webhook is accessible
    console.log("Testing webhook accessibility...");
    
    // Encode parameters for GET request
    const encodedURL = encodeURIComponent(url);
    const encodedApiKey = encodeURIComponent(apiKey);
    
    // Use GET request with query parameters instead of POST with body
    const requestUrl = `${webhookUrl}?URL=${encodedURL}&apiKey=${encodedApiKey}`;
    
    console.log("Sending GET request to webhook");
    
    // Send the GET request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook returned error status ${response.status}:`, errorText);
      throw new Error(`Webhook service returned ${response.status}: ${errorText || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log("Successfully received response from webhook");
    return data;
    
  } catch (error) {
    console.error("Webhook request failed:", error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the search service. The webhook service may be down or unreachable. Please try again later or contact support if the issue persists.');
    } else if (error.name === 'AbortError') {
      throw new Error('Search request timed out. Please try again with fewer search parameters or contact support.');
    } else {
      throw new Error(`Search service error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
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
  // Check if we have a valid response structure
  if (!response || !Array.isArray(response) || response.length === 0) {
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
  
  // The API response is an array where the first element contains the data
  const firstItem = response[0];
  
  // Check for people property which contains the search results
  if (firstItem && Array.isArray(firstItem.people)) {
    console.log(`Found ${firstItem.people.length} people results from Apollo`);
    return {
      results: firstItem.people,
      pagination: firstItem.pagination || { 
        page: 1,
        per_page: firstItem.people.length,
        total_entries: firstItem.people.length,
        total_pages: 1
      }
    };
  }
  
  // Check for contacts property as a fallback
  if (firstItem && Array.isArray(firstItem.contacts)) {
    console.log(`Found ${firstItem.contacts.length} contact results from Apollo`);
    return {
      results: firstItem.contacts,
      pagination: firstItem.pagination || { 
        page: 1,
        per_page: firstItem.contacts.length,
        total_entries: firstItem.contacts.length,
        total_pages: 1
      }
    };
  }
  
  console.warn("No recognizable results structure in Apollo response", firstItem);
  return {
    results: [],
    pagination: { 
      page: 1,
      per_page: 0,
      total_entries: 0,
      total_pages: 1
    }
  };
};
