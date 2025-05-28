
import { supabase } from "@/integrations/supabase/client";

/**
 * Apollo.io API Service
 * Handles direct integration with the Apollo.io API from the frontend
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
  return {
    personTitles: params.personTitles || [],
    location: params.location || '',
    organizationLocations: params.organizationLocations || [],
    seniorities: params.seniorities || [],
    emailStatus: params.emailStatus || [],
    employeeRanges: params.employeeRanges || [],
    keywords: params.keywords || [],
    limit: params.limit || 20
  };
};

// Function to make Apollo.io API requests directly from the frontend
export const apolloApiRequest = async (params: any, apiKey: string): Promise<any> => {
  try {
    console.log("Making direct Apollo.io API request");
    console.log("Request params:", params);
    
    // Format search parameters
    const searchParams = formatApolloSearchParams(params);
    
    console.log("Formatted search params:", searchParams);
    
    // Build the Apollo.io API URL
    const apolloUrl = new URL('https://api.apollo.io/api/v1/mixed_people/search');
    
    // Add search parameters to URL
    if (searchParams.personTitles && searchParams.personTitles.length > 0) {
      searchParams.personTitles.forEach((title: string) => {
        apolloUrl.searchParams.append('person_titles[]', title);
      });
    }
    
    if (searchParams.location) {
      apolloUrl.searchParams.append('person_locations[]', searchParams.location);
    }
    
    if (searchParams.organizationLocations && searchParams.organizationLocations.length > 0) {
      searchParams.organizationLocations.forEach((location: string) => {
        apolloUrl.searchParams.append('organization_locations[]', location);
      });
    }
    
    if (searchParams.seniorities && searchParams.seniorities.length > 0) {
      searchParams.seniorities.forEach((seniority: string) => {
        apolloUrl.searchParams.append('person_seniorities[]', seniority);
      });
    }
    
    if (searchParams.emailStatus && searchParams.emailStatus.length > 0) {
      searchParams.emailStatus.forEach((status: string) => {
        apolloUrl.searchParams.append('contact_email_status[]', status);
      });
    }
    
    if (searchParams.employeeRanges && searchParams.employeeRanges.length > 0) {
      searchParams.employeeRanges.forEach((range: string) => {
        apolloUrl.searchParams.append('organization_num_employees_ranges[]', range);
      });
    }

    if (searchParams.keywords && searchParams.keywords.length > 0) {
      const keywordsString = searchParams.keywords.join(" ");
      apolloUrl.searchParams.append('q_keywords', keywordsString);
    }
    
    apolloUrl.searchParams.append('page', '1');
    apolloUrl.searchParams.append('per_page', (searchParams.limit || 20).toString());

    console.log('Making direct Apollo.io API request to:', apolloUrl.toString());

    // Make the direct request to Apollo.io API
    const response = await fetch(apolloUrl.toString(), {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apollo.io API error: ${response.status} - ${errorText}`);
      
      let errorMessage = 'Apollo.io API request failed';
      if (response.status === 401) {
        errorMessage = 'Invalid Apollo.io API key';
      } else if (response.status === 429) {
        errorMessage = 'Apollo.io API rate limit exceeded';
      } else if (response.status === 403) {
        errorMessage = 'Apollo.io API access forbidden';
      }
      
      throw new Error(`${errorMessage}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Apollo.io API response received successfully');
    console.log('Response data sample:', JSON.stringify(data).substring(0, 500));

    return data;
    
  } catch (error) {
    console.error("Apollo.io API request failed:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid Apollo.io API key')) {
        throw new Error('Invalid Apollo.io API key. Please check your API key in settings.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Apollo.io API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('access forbidden')) {
        throw new Error('Access forbidden. Please check your Apollo.io API permissions.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Apollo.io API. Please check your internet connection.');
      } else {
        throw new Error(`Apollo.io API error: ${error.message}`);
      }
    } else {
      throw new Error('Apollo.io API error: Unknown error occurred');
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
