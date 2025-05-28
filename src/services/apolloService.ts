
/**
 * Apollo.io API Service
 * Handles direct integration with the Apollo.io API for lead generation
 */

// Helper function to format search parameters for Apollo.io API
export const formatApolloSearchParams = (params: {
  personTitles?: string[];
  location?: string;
  organizationLocations?: string[];
  seniorities?: string[];
  emailStatus?: string[];
  employeeRanges?: string[];
  keywords?: string[];
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  
  // Add person titles if available
  if (params.personTitles && params.personTitles.length > 0) {
    params.personTitles.forEach(title => {
      searchParams.append('person_titles[]', title);
    });
  }
  
  // Add person location if available
  if (params.location) {
    searchParams.append('person_locations[]', params.location);
  }
  
  // Add organization locations if available
  if (params.organizationLocations && params.organizationLocations.length > 0) {
    params.organizationLocations.forEach(location => {
      searchParams.append('organization_locations[]', location);
    });
  }
  
  // Add seniorities if available
  if (params.seniorities && params.seniorities.length > 0) {
    params.seniorities.forEach(seniority => {
      searchParams.append('person_seniorities[]', seniority);
    });
  }
  
  // Add email status if available
  if (params.emailStatus && params.emailStatus.length > 0) {
    params.emailStatus.forEach(status => {
      searchParams.append('contact_email_status[]', status);
    });
  }
  
  // Add employee ranges if available
  if (params.employeeRanges && params.employeeRanges.length > 0) {
    params.employeeRanges.forEach(range => {
      searchParams.append('organization_num_employees_ranges[]', range);
    });
  }

  // Add keywords (using q_keywords for Apollo's API)
  if (params.keywords && params.keywords.length > 0) {
    const keywordsString = params.keywords.join(" ");
    searchParams.append('q_keywords', keywordsString);
  }
  
  // Add page and per_page parameters
  searchParams.append('page', '1');
  searchParams.append('per_page', (params.limit || 20).toString());
  
  return searchParams;
};

// Function to make direct authenticated POST requests to Apollo.io API
export const apolloApiRequest = async (params: any, apiKey: string): Promise<any> => {
  try {
    console.log("Making direct Apollo.io API POST request");
    console.log("Request params:", params);
    
    // Format search parameters
    const searchParams = formatApolloSearchParams(params);
    const url = `https://api.apollo.io/api/v1/mixed_people/search?${searchParams.toString()}`;
    
    console.log("Request URL:", url);
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey // Apollo.io uses x-api-key header
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apollo.io API returned error status ${response.status}:`, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Apollo.io API key. Please check your API key in settings.');
      } else if (response.status === 429) {
        throw new Error('Apollo.io API rate limit exceeded. Please try again later.');
      } else if (response.status === 403) {
        throw new Error('Access forbidden. Please check your Apollo.io API permissions.');
      } else {
        throw new Error(`Apollo.io API returned ${response.status}: ${errorText || 'Unknown error'}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully received response from Apollo.io API");
    return data;
    
  } catch (error) {
    console.error("Apollo.io API request failed:", error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Apollo.io API. Please check your internet connection and try again.');
    } else if (error.name === 'AbortError') {
      throw new Error('Apollo.io API request timed out. Please try again.');
    } else {
      throw new Error(`Apollo.io API error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }
};

// Interface for Apollo API response
export interface ApolloResponse {
  people: any[];
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
  if (!response) {
    console.warn("No response from Apollo.io API");
    return {
      people: [],
      pagination: { 
        page: 1,
        per_page: 0,
        total_entries: 0,
        total_pages: 1
      }
    };
  }
  
  // Apollo.io API returns data in this format directly
  const people = response.people || [];
  const pagination = response.pagination || {
    page: 1,
    per_page: people.length,
    total_entries: people.length,
    total_pages: 1
  };
  
  console.log(`Found ${people.length} people results from Apollo.io`);
  
  return {
    people: people,
    pagination: pagination
  };
};
