
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

// Function to make Apollo.io API requests directly from the frontend with pagination support
export const apolloApiRequest = async (params: any, apiKey: string): Promise<any> => {
  try {
    console.log("Making direct Apollo.io API request");
    console.log("Request params:", params);
    
    // Format search parameters
    const searchParams = formatApolloSearchParams(params);
    console.log("Formatted search params:", searchParams);
    
    // Calculate pagination
    const totalLimit = searchParams.limit;
    const maxPerPage = 100; // Apollo.io max per page
    const totalPages = Math.ceil(totalLimit / maxPerPage);
    
    console.log(`Total requested: ${totalLimit}, Pages needed: ${totalPages}`);
    
    let allResults: any[] = [];
    
    // Make requests for each page needed
    for (let page = 1; page <= totalPages; page++) {
      const currentPageLimit = Math.min(maxPerPage, totalLimit - ((page - 1) * maxPerPage));
      
      console.log(`Fetching page ${page}/${totalPages} with ${currentPageLimit} results`);
      
      // Build the Apollo.io API URL for this page
      const apolloUrl = new URL('https://api.apollo.io/api/v1/mixed_people/search');
      
      // Add person_titles[] parameter (empty if no titles provided)
      if (searchParams.personTitles && searchParams.personTitles.length > 0) {
        searchParams.personTitles.forEach((title: string) => {
          apolloUrl.searchParams.append('person_titles[]', title);
        });
      } else {
        // Add empty person_titles[] parameter as shown in working example
        apolloUrl.searchParams.append('person_titles[]', '');
      }
      
      // Add person_locations[] parameter
      if (searchParams.location) {
        apolloUrl.searchParams.append('person_locations[]', searchParams.location);
      }
      
      // Add organization_locations[] parameter
      if (searchParams.organizationLocations && searchParams.organizationLocations.length > 0) {
        searchParams.organizationLocations.forEach((location: string) => {
          apolloUrl.searchParams.append('organization_locations[]', location);
        });
      }
      
      // Add person_seniorities[] parameter
      if (searchParams.seniorities && searchParams.seniorities.length > 0) {
        searchParams.seniorities.forEach((seniority: string) => {
          apolloUrl.searchParams.append('person_seniorities[]', seniority);
        });
      }
      
      // Add contact_email_status[] parameter
      if (searchParams.emailStatus && searchParams.emailStatus.length > 0) {
        searchParams.emailStatus.forEach((status: string) => {
          apolloUrl.searchParams.append('contact_email_status[]', status);
        });
      }
      
      // Add organization_num_employees_ranges[] parameter
      if (searchParams.employeeRanges && searchParams.employeeRanges.length > 0) {
        searchParams.employeeRanges.forEach((range: string) => {
          apolloUrl.searchParams.append('organization_num_employees_ranges[]', range);
        });
      }

      // Add q_keywords parameter (combine keywords into single string)
      if (searchParams.keywords && searchParams.keywords.length > 0) {
        const keywordsString = searchParams.keywords.join(" ");
        apolloUrl.searchParams.append('q_keywords', keywordsString);
      }
      
      // Add pagination parameters
      apolloUrl.searchParams.append('page', page.toString());
      apolloUrl.searchParams.append('per_page', currentPageLimit.toString());

      console.log(`Making Apollo.io API request to: ${apolloUrl.toString()}`);

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
        console.error(`Apollo.io API error on page ${page}: ${response.status} - ${errorText}`);
        
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

      const pageData = await response.json();
      console.log(`Apollo.io API page ${page} response received successfully`);
      console.log(`Page ${page} data sample:`, JSON.stringify(pageData).substring(0, 500));

      // Add this page's results to our collection
      if (pageData.people && Array.isArray(pageData.people)) {
        allResults = allResults.concat(pageData.people);
        console.log(`Added ${pageData.people.length} results from page ${page}. Total so far: ${allResults.length}`);
      }
      
      // If this page returned fewer results than requested, we've reached the end
      if (!pageData.people || pageData.people.length < currentPageLimit) {
        console.log(`Page ${page} returned fewer results than requested (${pageData.people?.length || 0} < ${currentPageLimit}). Stopping pagination.`);
        break;
      }
    }

    // Return combined results in Apollo.io format
    const combinedResponse = {
      people: allResults,
      pagination: {
        page: 1,
        per_page: allResults.length,
        total_entries: allResults.length,
        total_pages: 1
      }
    };

    console.log(`Final combined response: ${allResults.length} total people results`);
    return combinedResponse;
    
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
